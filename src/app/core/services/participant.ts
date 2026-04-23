import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParticipantModel } from '../../models/participant.model';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/events`;

  listByEvent(eventId: number): Observable<ParticipantModel[]> {
    return this.http.get<ParticipantModel[]>(`${this.apiUrl}/${eventId}/participants`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  subscribe(eventId: number): Observable<ParticipantModel> {
    return this.http.post<ParticipantModel>(
      `${this.apiUrl}/${eventId}/participants`,
      {},
      {
        headers: this.authService.getAuthHeaders()
      }
    );
  }

  cancelMySubscription(eventId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${eventId}/participants/me`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}