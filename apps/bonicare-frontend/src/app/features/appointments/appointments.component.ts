import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppointmentApiService } from '../../core/services/appointment-api.service';
import { DoctorApiService } from '../../core/services/doctor-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { AppointmentStatusPipe, StatusVariantPipe } from '../../shared/pipes/status.pipe';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Appointment, DoctorProfile, DoctorAvailability } from '../../shared/models/api-response.model';

@Component({
  selector: 'bc-appointments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    DateFormatPipe,
    AppointmentStatusPipe,
    StatusVariantPipe,
  ],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss',
})
export class AppointmentsComponent implements OnInit {
  private readonly api = inject(AppointmentApiService);
  private readonly doctorApi = inject(DoctorApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly isPatient = this.auth.hasRole('patient');
  readonly isDoctor = this.auth.hasRole('doctor');
  readonly loading = signal(true);
  readonly booking = signal(false);
  readonly appointments = signal<Appointment[]>([]);
  readonly doctors = signal<DoctorProfile[]>([]);
  readonly availability = signal<DoctorAvailability[]>([]);
  readonly showBooking = signal(false);
  readonly bookingError = signal<string | null>(null);

  readonly bookForm = this.fb.nonNullable.group({
    doctorId: ['', Validators.required],
    scheduledDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadAppointments();
    if (this.isPatient) {
      this.api.getDoctors().subscribe((res) => this.doctors.set(res.data ?? []));
    }
  }

  loadAppointments(): void {
    this.loading.set(true);
    const source$ = this.isPatient
      ? this.api.getMyAppointments()
      : this.doctorApi.getAppointments();

    source$.subscribe({
      next: (res) => {
        this.appointments.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onDoctorSelect(doctorId: string): void {
    this.bookForm.patchValue({ doctorId });
    this.api.getDoctorAvailability(doctorId).subscribe((res) => this.availability.set(res.data ?? []));
  }

  getDoctorAvatar(doctor: DoctorProfile): string {
    const name = this.getDoctorName(doctor);
    if (name.toLowerCase().includes('sara')) {
      return '/images/drsara.png';
    }
    return '/images/maledr.png';
  }

  book(): void {
    if (this.bookForm.invalid) return;
    this.booking.set(true);
    this.bookingError.set(null);
    const raw = this.bookForm.getRawValue();
    this.api.bookAppointment({
      ...raw,
      scheduledDate: new Date(raw.scheduledDate).toISOString(),
      startTime: new Date(`${raw.scheduledDate}T${raw.startTime}`).toISOString(),
      endTime: new Date(`${raw.scheduledDate}T${raw.endTime}`).toISOString(),
    }).subscribe({
      next: () => {
        this.toast.success('Appointment booked!');
        this.showBooking.set(false);
        this.bookForm.reset();
        this.loadAppointments();
        this.booking.set(false);
      },
      error: (err: HttpErrorResponse | any) => {
        this.booking.set(false);
        const errMsg = err?.error?.message || err?.message || 'Appointment booking failed. Please check slot availability.';
        this.bookingError.set(errMsg);
        this.toast.error('Booking failed');
      },
    });
  }

  cancel(id: string): void {
    this.api.cancelAppointment(id).subscribe({
      next: () => {
        this.toast.success('Appointment cancelled');
        this.loadAppointments();
      },
    });
  }

  getDoctorName(doctor: DoctorProfile): string {
    const u = doctor.userId;
    return typeof u === 'object' && u !== null && 'name' in u ? u.name : 'Doctor';
  }

  getDoctorUserId(doctor: DoctorProfile): string {
    const u = doctor.userId;
    if (typeof u === 'string') return u;
    if (typeof u === 'object' && u !== null) {
      return ('id' in u ? u.id : '_id' in u ? String((u as { _id: string })._id) : '') as string;
    }
    return '';
  }

  getPatientName(apt: Appointment): string {
    const p = apt.patientId;
    return typeof p === 'object' && p !== null && 'name' in p ? p.name : 'Patient';
  }
}
