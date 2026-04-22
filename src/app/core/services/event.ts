import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventModel } from '../../models/event.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3000/api/events';

  getAll(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(this.apiUrl);
  }

  getById(id: number): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.apiUrl}/${id}`);
  }

  create(event: EventModel): Observable<EventModel> {
    return this.http.post<EventModel>(this.apiUrl, event, {
      headers: this.authService.getAuthHeaders()
    });
  }

  update(id: number, event: Partial<EventModel>): Observable<EventModel> {
    return this.http.put<EventModel>(`${this.apiUrl}/${id}`, event, {
      headers: this.authService.getAuthHeaders()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}