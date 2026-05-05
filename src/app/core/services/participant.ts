import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParticipantModel } from '../../models/participant.model';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

export interface MySubscription {
  id: number;
  eventId: number;
  userId: number;
  name: string;
  email: string;
  subscriptionToken: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

export interface CheckinResponse {
  success: boolean;
  message: string;
  data?: {
    name: string;
    email: string;
    checkedInAt: string;
  };
}

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

  subscribe(eventId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${eventId}/participants`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  cancelMySubscription(eventId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${eventId}/participants/me`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // Busca a inscrição do usuário logado com o subscriptionToken para o QR code
  getMySubscription(eventId: number): Observable<{ success: boolean; data: MySubscription }> {
    return this.http.get<{ success: boolean; data: MySubscription }>(
      `${this.apiUrl}/${eventId}/participants/me`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // Admin valida o token lido pelo QR code
  validateCheckin(eventId: number, subscriptionToken: string): Observable<CheckinResponse> {
    return this.http.get<CheckinResponse>(
      `${this.apiUrl}/${eventId}/validate/${subscriptionToken}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }
}