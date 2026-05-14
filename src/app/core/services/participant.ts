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

  /**
   * FIX — Check-in via token (admin).
   *
   * Antes chamava GET /:id/validate/:token, que só verifica existência
   * e nunca bloqueia duplicata. Agora chama POST /:id/checkin com o
   * subscriptionToken no body — endpoint que seta isCheckedIn=true e
   * retorna 409 quando o participante já fez check-in.
   */
  checkIn(eventId: number, subscriptionToken: string): Observable<CheckinResponse> {
    return this.http.post<CheckinResponse>(
      `${this.apiUrl}/${eventId}/checkin`,
      { subscriptionToken },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /**
   * Mantido para uso futuro (ex: pré-validar token antes de confirmar),
   * mas NÃO deve ser usado como substituto do checkIn().
   */
  validateCheckin(eventId: number, subscriptionToken: string): Observable<CheckinResponse> {
    return this.http.get<CheckinResponse>(
      `${this.apiUrl}/validate/${subscriptionToken}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }
}