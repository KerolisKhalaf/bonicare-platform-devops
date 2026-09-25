import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiApiService } from '../../core/services/ai-api.service';
import { PatientApiService } from '../../core/services/patient-api.service';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AiReport, BoneFractureResult } from '../../shared/models/api-response.model';

@Component({
  selector: 'bc-ai-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
  ],
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.scss',
})
export class AiReportsComponent implements OnInit {
  private readonly aiApi = inject(AiApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly reports = signal<AiReport[]>([]);
  readonly loading = signal(true);
  readonly predicting = signal(false);
  readonly fractureLoading = signal(false);
  readonly lastPrediction = signal<AiReport | null>(null);
  readonly fractureResult = signal<BoneFractureResult | null>(null);
  readonly aiHealthy = signal<boolean | null>(null);
  readonly patientId = signal<string | null>(null);

  readonly featureForm = this.fb.nonNullable.group({
    features: ['', Validators.required],
  });

  ngOnInit(): void {
    this.aiApi.checkHealth().subscribe({
      next: () => this.aiHealthy.set(true),
      error: () => this.aiHealthy.set(false),
    });

    this.patientApi.getDashboard().subscribe({
      next: (res) => {
        this.patientId.set(res.patient?._id ?? null);
        this.reports.set(res.ai_reports ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  runPrediction(): void {
    const pid = this.patientId();
    if (!pid) {
      this.toast.error('Patient profile not found');
      return;
    }

    const raw = this.featureForm.getRawValue().features;
    const features = raw.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));

    if (features.length !== 12) {
      this.toast.error('Exactly 12 numeric features required (comma-separated)');
      return;
    }

    this.predicting.set(true);
    this.aiApi.predict({ patientId: pid, features }).subscribe({
      next: (res) => {
        this.lastPrediction.set(res.data);
        this.reports.update((list) => [res.data, ...list]);
        this.toast.success('AI prediction complete');
        this.predicting.set(false);
      },
      error: () => this.predicting.set(false),
    });
  }

  onFractureImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.fractureLoading.set(true);
    this.aiApi.predictBoneFracture(file).subscribe({
      next: (res) => {
        this.fractureResult.set(res.result);
        this.reports.update((list) => [res.data, ...list]);
        this.toast.success('Bone fracture analysis complete');
        this.fractureLoading.set(false);
      },
      error: () => this.fractureLoading.set(false),
    });
  }

  getReportLabel(report: AiReport): string {
    return `${this.getReportMode(report)} ${report.output_json.label ?? 'Unknown'}`;
  }

  getReportMode(report: AiReport): string {
    return report.model_name.startsWith('bone-fracture')
      ? 'Bone Fracture Detection'
      : 'Lower Back Analysis';
  }

  getResultVariant(label: string | undefined): 'default' | 'success' | 'warning' | 'danger' {
    const normalized = label?.toLowerCase() ?? '';
    if (normalized.includes('normal') || normalized.includes('not fractured')) return 'success';
    if (normalized.includes('fractured') || normalized.includes('hernia') || normalized.includes('stenosis')) {
      return 'danger';
    }
    return 'warning';
  }
}
