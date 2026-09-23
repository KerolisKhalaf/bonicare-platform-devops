import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiSuccessResponse, MedicalFile } from '../../shared/models/api-response.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MedicalFileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/files`;

  list(): Observable<ApiSuccessResponse<MedicalFile[]>> {
    return this.http.get<ApiSuccessResponse<MedicalFile[]>>(`${this.baseUrl}`);
  }

  upload(file: File, modality = 'Unknown', part = 'Unknown'): Observable<HttpEvent<ApiSuccessResponse<MedicalFile>>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modality', modality);
    formData.append('part', part);

    return this.http.post<ApiSuccessResponse<MedicalFile>>(`${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  delete(filename: string): Observable<ApiSuccessResponse<MedicalFile>> {
    return this.http.delete<ApiSuccessResponse<MedicalFile>>(`${this.baseUrl}/${encodeURIComponent(filename)}`);
  }

}
