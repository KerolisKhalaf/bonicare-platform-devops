import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { SocketService } from '../../core/services/socket.service';

export type CallState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed';
export type MediaState = { audio: boolean; video: boolean; screen: boolean };

@Injectable({ providedIn: 'root' })
export class WebRtcService implements OnDestroy {
  private readonly socket = inject(SocketService);

  readonly callState = signal<CallState>('idle');
  readonly mediaState = signal<MediaState>({ audio: true, video: true, screen: false });
  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);
  readonly networkQuality = signal<'good' | 'fair' | 'poor'>('good');
  readonly signalingAvailable = this.socket.signalingAvailable;

  private peerConnection: RTCPeerConnection | null = null;
  private appointmentId: string | null = null;
  private isInitiator = false;
  private peerCount = 0;
  private listenersRegistered = false;
  private remoteDescriptionSet = false;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  private readonly iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ];

  constructor() {
    this.setupSignalingListeners();
  }

  async startCall(appointmentId: string): Promise<void> {
    this.appointmentId = appointmentId;
    this.callState.set('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream.set(stream);
      this.createPeerConnection();
      stream.getTracks().forEach((track) => this.peerConnection!.addTrack(track, stream));

      this.joinCall(appointmentId);
      this.createOfferIfReady();
    } catch {
      this.callState.set('failed');
    }
  }

  joinCall(appointmentId: string): void {
    if (this.appointmentId === appointmentId && this.peerCount > 0) return;

    if (this.appointmentId && this.appointmentId !== appointmentId) {
      this.socket.emitCallEvent('call:leave', { appointmentId: this.appointmentId });
      this.cleanup();
    }

    this.appointmentId = appointmentId;
    this.socket.emitCallEvent('call:join', { appointmentId });
  }

  async toggleAudio(): Promise<void> {
    const stream = this.localStream();
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      this.mediaState.update((s) => ({ ...s, audio: track.enabled }));
    }
  }

  async toggleVideo(): Promise<void> {
    const stream = this.localStream();
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      this.mediaState.update((s) => ({ ...s, video: track.enabled }));
    }
  }

  async toggleScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      this.mediaState.update((s) => ({ ...s, screen: true }));
      screenTrack.onended = () => this.stopScreenShare();
    } catch {
      // user cancelled
    }
  }

  endCall(): void {
    if (this.appointmentId) {
      this.socket.emitCallEvent('call:leave', { appointmentId: this.appointmentId });
    }
    this.cleanup();
    this.callState.set('ended');
  }

  ngOnDestroy(): void {
    this.endCall();
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.appointmentId) {
        this.socket.emitCallEvent('call:ice-candidate', {
          appointmentId: this.appointmentId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream.set(event.streams[0]);
      this.callState.set('connected');
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'connected') this.callState.set('connected');
      else if (state === 'connecting') this.callState.set('connecting');
      else if (state === 'disconnected') this.callState.set('reconnecting');
      else if (state === 'failed') this.callState.set('failed');
    };
  }

  private setupSignalingListeners(): void {
    if (this.listenersRegistered) return;
    this.listenersRegistered = true;

    this.socket.onCallEvent('call:joined', async (data: unknown) => {
      const { appointmentId, initiator, peerCount } = data as {
        appointmentId: string;
        initiator: boolean;
        peerCount: number;
      };
      if (this.appointmentId !== appointmentId) return;
      this.isInitiator = initiator;
      this.peerCount = peerCount;
      this.createOfferIfReady();
    });

    this.socket.onCallEvent('call:peer-joined', async (data: unknown) => {
      const { appointmentId, peerCount } = data as { appointmentId: string; peerCount: number };
      this.peerCount = peerCount;
      if (!this.isInitiator || this.appointmentId !== appointmentId || !this.peerConnection) return;

      await this.createOfferIfReady();
    });

    this.socket.onCallEvent('call:peer-left', (data: unknown) => {
      const { appointmentId } = data as { appointmentId: string };
      if (this.appointmentId !== appointmentId) return;
      this.peerCount = 1;
      this.remoteStream.set(null);
      if (this.callState() === 'connected') this.callState.set('reconnecting');
    });

    this.socket.onCallEvent('call:offer', async (data: unknown) => {
      const { appointmentId, sdp } = data as { appointmentId: string; sdp: RTCSessionDescriptionInit };
      if (this.appointmentId && this.appointmentId !== appointmentId) return;

      if (!this.appointmentId) {
        this.appointmentId = appointmentId;
      }

      if (!this.peerConnection) {
        this.callState.set('connecting');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.localStream.set(stream);
        this.createPeerConnection();
        stream.getTracks().forEach((track) => this.peerConnection!.addTrack(track, stream));
      }

      const peerConnection = this.peerConnection;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(sdp);
      this.remoteDescriptionSet = true;
      await this.flushPendingIceCandidates(peerConnection);
      const answer = await peerConnection.createAnswer();
      if (this.appointmentId) {
        await peerConnection.setLocalDescription(answer);
        this.socket.emitCallEvent('call:answer', { appointmentId, sdp: answer });
      }
    });

    this.socket.onCallEvent('call:answer', async (data: unknown) => {
      const { sdp } = data as { sdp: RTCSessionDescriptionInit };
      const peerConnection = this.peerConnection;
      if (!peerConnection) return;
      await peerConnection.setRemoteDescription(sdp);
      this.remoteDescriptionSet = true;
      await this.flushPendingIceCandidates(peerConnection);
    });

    this.socket.onCallEvent('call:ice-candidate', async (data: unknown) => {
      const { candidate } = data as { candidate: RTCIceCandidateInit };
      const peerConnection = this.peerConnection;
      if (!peerConnection || !this.remoteDescriptionSet) {
        this.pendingIceCandidates.push(candidate);
        return;
      }
      await peerConnection.addIceCandidate(candidate);
    });
  }

  private async flushPendingIceCandidates(peerConnection: RTCPeerConnection): Promise<void> {
    const candidates = this.pendingIceCandidates;
    this.pendingIceCandidates = [];
    for (const candidate of candidates) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  private async createOfferIfReady(): Promise<void> {
    if (!this.isInitiator || this.peerCount < 2 || !this.peerConnection || !this.appointmentId) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emitCallEvent('call:offer', { appointmentId: this.appointmentId, sdp: offer });
  }

  private stopScreenShare(): void {
    this.mediaState.update((s) => ({ ...s, screen: false }));
  }

  private cleanup(): void {
    this.localStream()?.getTracks().forEach((t) => t.stop());
    this.peerConnection?.close();
    this.peerConnection = null;
    this.isInitiator = false;
    this.peerCount = 0;
    this.remoteDescriptionSet = false;
    this.pendingIceCandidates = [];
    this.localStream.set(null);
    this.remoteStream.set(null);
    this.appointmentId = null;
  }
}
