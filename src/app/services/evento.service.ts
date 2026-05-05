import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EventModel } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventoService {

  private apiUrl = 'http://localhost:3000/events';

  constructor(private http: HttpClient) {}

  // 🔹 MOCK (usar se backend não estiver rodando)
  getEventosMock(): Observable<{ data: EventModel[] }> {
    return of({
      data: [
        {
          id: 1,
          title: 'Evento Angular',
          name: 'Evento Angular',
          description: '',
          date: '2026-05-10',
          time: '19:00',
          location: 'Online',
          maxParticipants: 100,
          registeredParticipants: 45
        },
        {
          id: 2,
          title: 'Workshop Node',
          name: 'Workshop Node',
          description: '',
          date: '2026-05-12',
          time: '20:00',
          location: 'Presencial',
          maxParticipants: 50,
          registeredParticipants: 30
        },
        {
          id: 3,
          title: 'Semana Tech',
          name: 'Semana Tech',
          description: '',
          date: '2026-05-15',
          time: '18:00',
          location: 'Auditório',
          maxParticipants: 200,
          registeredParticipants: 80
        }
      ]
    });
  }

  // 🔥 BACKEND REAL (usar no dashboard)
  getEvents(): Observable<{ data: EventModel[] }> {
    return this.http.get<{ data: EventModel[] }>(this.apiUrl);
  }
}