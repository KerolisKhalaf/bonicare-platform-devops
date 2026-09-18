import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface ChatMessage {
  _id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private socket: Socket | null = null;
  private signalingSocket: Socket | null = null;
  private readonly joinedConversations = new Set<string>();

  readonly connected = signal(false);
  readonly lastMessage = signal<ChatMessage | null>(null);
  readonly signalingAvailable = signal(false);

  connect(): void {
    if (this.socket) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      for (const conversationId of this.joinedConversations) {
        this.socket?.emit('joinConversation', conversationId);
      }
    });
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('newMessage', (msg: ChatMessage) => this.lastMessage.set(msg));
    this.socket.on('error', (err: string) => console.error('[Socket]', err));
  }

  connectSignaling(): void {
    if (this.signalingSocket) return;

    this.signalingSocket = io(environment.webRtcUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.signalingSocket.on('connect', () => {
      this.signalingSocket?.emit('call:ping');
    });
    this.signalingSocket.on('call:pong', () => this.signalingAvailable.set(true));
    this.signalingSocket.on('disconnect', () => this.signalingAvailable.set(false));
    this.signalingSocket.on('connect_error', (error) => {
      this.signalingAvailable.set(false);
      console.error('[WebRTC signaling]', error);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.joinedConversations.clear();
    this.signalingSocket?.disconnect();
    this.signalingSocket = null;
    this.connected.set(false);
    this.signalingAvailable.set(false);
  }

  joinConversation(conversationId: string): void {
    this.connect();
    this.joinedConversations.add(conversationId);
    this.socket?.emit('joinConversation', conversationId);
  }

  sendMessage(data: Omit<ChatMessage, '_id' | 'createdAt'>): void {
    this.connect();
    this.socket?.emit('sendMessage', data);
  }

  onNewMessage(callback: (msg: ChatMessage) => void): void {
    this.connect();
    this.socket?.on('newMessage', callback);
  }

  emitCallEvent(event: string, payload: unknown): void {
    this.connectSignaling();
    this.signalingSocket?.emit(event, payload);
  }

  onCallEvent(event: string, callback: (data: unknown) => void): void {
    this.connectSignaling();
    this.signalingSocket?.on(event, callback);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
