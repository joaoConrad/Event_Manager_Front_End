import { Injectable } from '@angular/core';
import { EventModel } from '../../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private events: EventModel[] = [
    {
      id: 1,
      title: 'Semana Acadêmica de TI',
      description: 'Evento voltado para tecnologia, inovação e integração acadêmica.',
      date: '2026-05-15',
      time: '09:00',
      location: 'Auditório Prédio 5',
      maxParticipants: 100,
      registeredParticipants: 45
    },
    {
      id: 2,
      title: 'Workshop Java Web',
      description: 'Oficina prática de desenvolvimento Java para aplicações web.',
      date: '2026-06-22',
      time: '14:00',
      location: 'Laboratório 203',
      maxParticipants: 50,
      registeredParticipants: 50
    },
    {
      id: 3,
      title: 'Palestra Inovação Digital',
      description: 'Discussão sobre tendências e desafios da transformação digital.',
      date: '2026-07-10',
      time: '19:00',
      location: 'Anfiteatro Central',
      maxParticipants: 80,
      registeredParticipants: 32
    },
    {
      id: 4,
      title: 'Minicurso de APIs REST',
      description: 'Introdução prática à criação e consumo de APIs REST.',
      date: '2026-08-05',
      time: '18:30',
      location: 'Sala 12',
      maxParticipants: 40,
      registeredParticipants: 18
    },
    {
      id: 5,
      title: 'Bootcamp Frontend Angular',
      description: 'Evento focado em Angular, componentização e rotas.',
      date: '2026-09-01',
      time: '08:30',
      location: 'Laboratório 101',
      maxParticipants: 30,
      registeredParticipants: 30
    }
  ];

  getAll(): EventModel[] {
    return this.events;
  }
}