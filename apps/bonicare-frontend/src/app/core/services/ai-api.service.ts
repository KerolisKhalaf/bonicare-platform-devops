import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ApiSuccessResponse,
  AiPredictRequest,
  AiReport,
  BoneFractureResult,
} from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ai`;

  predict(data: AiPredictRequest) {
    return this.http.post<{ status: string; data: AiReport }>(`${this.baseUrl}/predict`, data);
  }

  predictBoneFracture(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ status: string; data: AiReport; result: BoneFractureResult }>(
      `${this.baseUrl}/bone-fracture`,
      formData
    );
  }

  checkHealth() {
    return this.http.get<ApiSuccessResponse<unknown>>(`${this.baseUrl}/health`);
  }
}
