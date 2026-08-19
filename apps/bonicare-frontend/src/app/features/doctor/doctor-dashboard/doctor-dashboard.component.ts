import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DoctorApiService } from '../../../core/services/doctor-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { AppointmentStatusPipe, StatusVariantPipe } from '../../../shared/pipes/status.pipe';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DoctorProfile, Appointment } from '../../../shared/models/api-response.model';

@Component({
  selector: 'bc-doctor-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    SkeletonComponent,
    DateFormatPipe,
    AppointmentStatusPipe,
    StatusVariantPipe,
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss',
})
export class DoctorDashboardComponent implements OnInit {
  private readonly doctorApi = inject(DoctorApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly profile = signal<DoctorProfile | null>(null);
  readonly appointments = signal<Appointment[]>([]);
  readonly showProfileForm = signal(false);

  getDoctorAvatar(): string {
    const u = this.user();
    if (u && u.name?.toLowerCase().includes('sara')) {
      return '/images/drsara.png';
    }
    return '/images/maledr.png';
  }

  readonly profileForm = this.fb.nonNullable.group({
    specialty: [''],
    bio: [''],
    licenseNumber: [''],
    yearsOfExperience: [0],
    hospitalInfo: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.doctorApi.getProfile().subscribe({
      next: (res) => {
        const p = res.data ?? null;
        this.profile.set(p);
        if (p) {
          this.profileForm.patchValue({
            specialty: p.specialty ?? '',
            bio: p.bio ?? '',
            licenseNumber: p.licenseNumber ?? '',
            yearsOfExperience: p.yearsOfExperience ?? 0,
            hospitalInfo: p.hospitalInfo ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.doctorApi.getAppointments().subscribe({
      next: (res) => this.appointments.set(res.data ?? []),
    });
  }

  saveProfile(): void {
    this.saving.set(true);
    this.doctorApi.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (res) => {
        this.profile.set(res.data ?? null);
        this.showProfileForm.set(false);
        this.toast.success('Profile updated');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  getPatientName(apt: Appointment): string {
    const p = apt.patientId;
    return typeof p === 'object' && p !== null && 'name' in p ? p.name : 'Patient';
  }
}
