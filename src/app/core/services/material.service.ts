import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MaterialModel, MaterialType } from '../../models/material.model';
import { EventModel } from '../../models/event.model';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

interface EventsResponse {
  data: EventModel[];
}

interface MaterialApiRow {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  title?: string | null;
  createdAt: string;
}

interface MaterialsResponse {
  success: boolean;
  data: MaterialApiRow[];
}

@Injectable({
  providedIn: 'root',
})
export class MaterialService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly eventsUrl = `${environment.apiUrl}/events`;

  getMaterials(): Observable<MaterialModel[]> {
    return this.http
      .get<EventsResponse>(this.eventsUrl, {
        headers: this.authService.getAuthHeaders(),
        params: { page: '1', limit: '50' },
      })
      .pipe(
        map((response) => response.data ?? []),
        switchMap((events) => {
          const registeredEvents = events.filter((event) => event.id && event.isUserRegistered);

          if (registeredEvents.length === 0) {
            return of([]);
          }

          const requests = registeredEvents.map((event) =>
            this.getMaterialsByEvent(event.id!, event).pipe(catchError(() => of([])))
          );

          return forkJoin(requests).pipe(map((groups) => groups.flat()));
        })
      );
  }

  getMaterialsByEvent(eventId: number, event?: EventModel): Observable<MaterialModel[]> {
    return this.http
      .get<MaterialsResponse>(`${this.eventsUrl}/${eventId}/materials`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        map((response) =>
          (response.data ?? []).map((material) => this.toMaterialModel(material, eventId, event))
        )
      );
  }

  uploadMaterial(eventId: number, title: string, file: File): Observable<MaterialModel> {
    const formData = new FormData();
    formData.append('file', file);
    if (title.trim()) {
      formData.append('title', title.trim());
    }

    return this.http
      .post<{ success: boolean; data: MaterialApiRow }>(
        `${this.eventsUrl}/${eventId}/materials`,
        formData,
        { headers: this.authService.getAuthHeaders() }
      )
      .pipe(map((response) => this.toMaterialModel(response.data, eventId)));
  }

  deleteMaterial(eventId: number, materialId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.eventsUrl}/${eventId}/materials/${materialId}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  downloadMaterial(material: MaterialModel): Observable<Blob> {
    return this.http.get(material.url, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  saveMaterialFile(material: MaterialModel, blob: Blob): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = material.description || material.title;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }

  private toMaterialModel(
    material: MaterialApiRow,
    eventId: number,
    event?: EventModel
  ): MaterialModel {
    return {
      id: material.id,
      title: material.title || material.fileName,
      description: material.fileName,
      type: this.getMaterialType(material.fileType, material.fileName),
      url: `${this.eventsUrl}/${eventId}/materials/${material.id}/download`,
      eventId,
      eventTitle: event?.title ?? `Evento #${eventId}`,
      eventDate: event?.startDate ?? event?.date ?? '',
      releasedAt: material.createdAt,
      sizeLabel: this.formatFileSize(material.fileSize),
    };
  }

  private getMaterialType(fileType: string, fileName: string): MaterialType {
    const mime = fileType.toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (mime.includes('pdf') || extension === 'pdf') return 'pdf';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('image/')) return 'image';
    if (['zip', 'rar', '7z'].includes(extension ?? '')) return 'zip';

    return 'link';
  }

  private formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    return `${size.toLocaleString('pt-BR', {
      maximumFractionDigits: unitIndex === 0 ? 0 : 1,
    })} ${units[unitIndex]}`;
  }
}
