import { Component, inject, signal, OnInit, ElementRef, ViewChild, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { DoctorApiService } from '../../core/services/doctor-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { WebRtcService } from './webrtc.service';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { Appointment } from '../../shared/models/api-response.model';

@Component({
  selector: 'bc-video-consultation',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, ButtonComponent, BadgeComponent, DateFormatPipe],
  templateUrl: './video-consultation.component.html',
  styleUrl: './video-consultation.component.scss',
})
export class VideoConsultationComponent implements OnInit {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  private readonly appointmentApi = inject(AppointmentApiService);
  private readonly doctorApi = inject(DoctorApiService);
  private readonly auth = inject(AuthService);
  readonly socket = inject(SocketService);
  readonly webrtc = inject(WebRtcService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.user;
  readonly appointments = signal<Appointment[]>([]);
  readonly selectedAppointment = signal<Appointment | null>(null);
  readonly selectedAppointmentId = signal<string | null>(null);
  readonly chatMessage = signal('');
  readonly chatMessages = signal<Array<{ content: string; sender: string }>>([]);

  readonly appointmentForm = this.fb.nonNullable.group({
    appointmentId: [''],
  });

  constructor() {
    effect(() => {
      const local = this.webrtc.localStream();
      const remote = this.webrtc.remoteStream();
      if (this.localVideoRef?.nativeElement && local) {
        this.localVideoRef.nativeElement.srcObject = local;
      }
      if (this.remoteVideoRef?.nativeElement && remote) {
        this.remoteVideoRef.nativeElement.srcObject = remote;
      }
    });
  }

  ngOnInit(): void {
    this.socket.connectSignaling();
    const source$ = this.auth.hasRole('patient')
      ? this.appointmentApi.getMyAppointments()
      : this.doctorApi.getAppointments();

    source$.subscribe((res) => {
      this.appointments.set(
        (res.data ?? []).filter((a) => a.status === 'scheduled')
      );
    });

    this.socket.onNewMessage((msg) => {
      this.chatMessages.update((list) => [
        ...list,
        { content: msg.content, sender: msg.senderId },
      ]);
    });
  }

  async startCall(): Promise<void> {
    const id = this.appointmentForm.getRawValue().appointmentId;
    if (!id) return;
    if (this.selectedAppointment()?.['_id'] !== id) {
      this.onAppointmentSelected();
    }
    this.selectedAppointmentId.set(id);
    this.socket.joinConversation(id);
    await this.webrtc.startCall(id);
  }

  onAppointmentSelected(): void {
    const id = this.appointmentForm.getRawValue().appointmentId;
    const appointment = this.appointments().find((item) => item._id === id) ?? null;
    this.selectedAppointment.set(appointment);
    this.selectedAppointmentId.set(id || null);
    this.chatMessages.set([]);
    if (id) {
      this.socket.joinConversation(id);
      this.webrtc.joinCall(id);
    }
  }

  endCall(): void {
    this.webrtc.endCall();
    this.selectedAppointmentId.set(null);
  }

  sendChat(): void {
    const content = this.chatMessage().trim();
    const aptId = this.selectedAppointmentId();
    const user = this.auth.user();
    if (!content || !aptId || !user) return;

    this.socket.sendMessage({
      conversationId: aptId,
      senderId: user.id,
      receiverId: this.getChatRecipientId(),
      content,
    });
    this.chatMessage.set('');
  }

  isOwnMessage(senderId: string): boolean {
    return senderId === this.user()?.id;
  }

  getMessageSenderLabel(senderId: string): string {
    return this.isOwnMessage(senderId) ? 'You' : this.auth.hasRole('patient') ? 'Doctor' : 'Patient';
  }

  private getChatRecipientId(): string {
    const appointment = this.selectedAppointment();
    if (!appointment) return '';

    const participant = this.auth.hasRole('patient') ? appointment.doctorId : appointment.patientId;
    if (typeof participant === 'string') return participant;
    if (participant && typeof participant === 'object' && 'id' in participant) return participant.id;
    return '';
  }
}
