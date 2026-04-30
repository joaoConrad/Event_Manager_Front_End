import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventHistory } from '../../models/history.model';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventHistoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/event-history`;

  getByEventId(eventId: number): Observable<EventHistory[]> {
    return this.http.get<EventHistory[]>(`${this.apiUrl}/event/${eventId}`, {
      headers: this.authService.getAuthHeaders(),
    });
  }
}
