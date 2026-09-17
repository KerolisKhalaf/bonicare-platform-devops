import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { PatientApiService } from '../../core/services/patient-api.service';
import { MedicalFileApiService } from '../../core/services/medical-file-api.service';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { MedicalFile } from '../../shared/models/api-response.model';

@Component({
  selector: 'bc-medical-files',
  standalone: true,
  imports: [CardComponent, ButtonComponent, DateFormatPipe],
  templateUrl: './medical-files.component.html',
  styleUrl: './medical-files.component.scss',
})
export class MedicalFilesComponent implements OnInit {
  private readonly patientApi = inject(PatientApiService);
  private readonly fileApi = inject(MedicalFileApiService);
  private readonly toast = inject(ToastService);

  readonly files = signal<MedicalFile[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading.set(true);
    this.patientApi.getDashboard().subscribe({
      next: (res) => {
        this.files.set(res.files ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      this.toast.error('Only images (JPEG, PNG, WebP) and PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toast.error('File size must be under 10MB.');
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);

    const modality = file.type === 'application/pdf' ? 'PDF' : 'X-ray';
    this.fileApi.upload(file, modality, 'Unknown').subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          this.toast.success('File uploaded successfully');
          this.uploading.set(false);
          this.uploadProgress.set(0);
          this.loadFiles();
          input.value = '';
        }
      },
      error: () => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
      },
    });
  }

  deleteFile(file: MedicalFile): void {
    const filename = file.filename;
    if (!filename) return;

    this.fileApi.delete(filename).subscribe({
      next: () => {
        this.toast.success('File deleted successfully');
        this.loadFiles();
      },
      error: () => this.toast.error('Could not delete file'),
    });
  }

  getFileName(file: MedicalFile): string {
    return file.originalName ?? file.originalname ?? file.filename ?? 'Unknown';
  }

}
