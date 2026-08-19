import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PatientApiService } from '../../../core/services/patient-api.service';
import { AppointmentApiService } from '../../../core/services/appointment-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { AppointmentStatusPipe, StatusVariantPipe } from '../../../shared/pipes/status.pipe';
import { PatientProfile, MedicalFile, AiReport, Appointment } from '../../../shared/models/api-response.model';

@Component({
  selector: 'bc-patient-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CardComponent,
    BadgeComponent,
    SkeletonComponent,
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

  readonly user = this.auth.user;
  readonly loading = signal(true);
  readonly patient = signal<PatientProfile | null>(null);
  readonly files = signal<MedicalFile[]>([]);
  readonly aiReports = signal<AiReport[]>([]);
  readonly appointments = signal<Appointment[]>([]);

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
}
