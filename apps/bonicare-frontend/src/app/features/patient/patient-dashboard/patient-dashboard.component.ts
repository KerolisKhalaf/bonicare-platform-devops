import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PatientApiService } from '../../../core/services/patient-api.service';
import { AppointmentApiService } from '../../../core/services/appointment-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { AppointmentStatusPipe, StatusVariantPipe } from '../../../shared/pipes/status.pipe';
import { PatientProfile, MedicalFile, AiReport, Appointment } from '../../../shared/models/api-response.model';

@Component({
  selector: 'bc-patient-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CardComponent,
    BadgeComponent,
    SkeletonComponent,
    ButtonComponent,
    DateFormatPipe,
    AppointmentStatusPipe,
    StatusVariantPipe,
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
  private readonly patientApi = inject(PatientApiService);
  private readonly appointmentApi = inject(AppointmentApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly user = this.auth.user;
  readonly loading = signal(true);
  readonly patient = signal<PatientProfile | null>(null);
  readonly files = signal<MedicalFile[]>([]);
  readonly aiReports = signal<AiReport[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly editingProfile = signal(false);
  readonly profileForm = this.fb.nonNullable.group({
    name: [''],
    phone: [''],
    dob: [''],
    gender: [''],
  });

  getPatientAvatar(): string {
    const u = this.user();
    if (!u) return '/images/femaleclient1.png';
    const charCodeSum = u.name?.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) ?? 0;
    const index = (charCodeSum % 4) + 1;
    if (index === 4) {
      return '/images/maleclient1.png';
    }
    return `/images/femaleclient${index}.png`;
  }

  ngOnInit(): void {
    this.patientApi.getDashboard().subscribe({
      next: (res) => {
        this.patient.set(res.patient);
        this.profileForm.patchValue({
          name: this.user()?.name ?? '',
          phone: this.user()?.phone ?? '',
          dob: res.patient?.dob?.slice(0, 10) ?? '',
          gender: res.patient?.gender ?? '',
        });
        this.files.set(res.files ?? []);
        this.aiReports.set(res.ai_reports ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.appointmentApi.getMyAppointments().subscribe({
      next: (res) => this.appointments.set(res.data ?? []),
    });
  }

  saveProfile(): void {
    const value = this.profileForm.getRawValue();
    this.patientApi.updateProfile({
      name: value.name,
      phone: value.phone || undefined,
      dob: value.dob || undefined,
      gender: value.gender ? (value.gender as 'male' | 'female' | 'other') : undefined,
    }).subscribe({
      next: (res) => {
        if (res.data?.user) this.auth.updateUser(res.data.user);
        if (res.data?.patient) this.patient.set(res.data.patient);
        this.editingProfile.set(false);
        this.toast.success('Profile updated');
      },
      error: () => this.toast.error('Could not update profile'),
    });
  }
}
