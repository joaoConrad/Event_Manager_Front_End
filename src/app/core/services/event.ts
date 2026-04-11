import { Injectable } from '@angular/core';
import { EventModel } from '../../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private events: EventModel[] = [
    {
      id: 1,
      title: 'Workshop de APIs REST',
      description: 'Evento voltado para desenvolvimento de APIs com Spring Boot e Express',
      date: '2026-05-20',
      time: '19:00',
      location: 'Laboratório 2',
      maxParticipants: 40
    },
    {
      id: 2,
      title: 'Semana da Computação',
      description: 'Palestras e atividades práticas',
      date: '2026-06-10',
      time: '20:00',
      location: 'Auditório',
      maxParticipants: 80
    }
  ];

  getAll(): EventModel[] {
    return this.events;
  }
}