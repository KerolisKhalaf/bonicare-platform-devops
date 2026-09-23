import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ApiSuccessResponse,
  PatientProfile,
  MedicalFile,
  AiReport,
  Appointment,
  AuthUser,
  UpdatePatientProfileRequest,
} from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class PatientApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/patient`;

  getDashboard() {
    return this.http.get<ApiSuccessResponse<never> & {
      patient: PatientProfile;
      files: MedicalFile[];
      ai_reports: AiReport[];
      appointments: Appointment[];
    }>(`${this.baseUrl}/dashboard`);
  }

  getProfile() {
    return this.http.get<ApiSuccessResponse<{ user: AuthUser; patient: PatientProfile }>>(`${this.baseUrl}/profile`);
  }

  updateProfile(data: UpdatePatientProfileRequest) {
    return this.http.put<ApiSuccessResponse<{ user: AuthUser; patient: PatientProfile }>>(
      `${this.baseUrl}/profile`,
      data
    );
  }
}
