import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent {

  event = {
    id: 1,
    title: 'Evento Teste',
    description: 'Descrição',
    date: '2026-05-20',
    time: '19:00',
    location: 'Sala 1',
    maxParticipants: 50
  };

}