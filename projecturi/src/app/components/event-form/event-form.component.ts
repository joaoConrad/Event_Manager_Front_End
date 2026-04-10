import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent {

  constructor(private router: Router) {}

  isEdit = false;

  event: any = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: 0
  };

  saveEvent() {
  if (typeof window !== 'undefined') {

    let events = JSON.parse(localStorage.getItem('events') || '[]');

    this.event.id = new Date().getTime();

    events.push(this.event);

    localStorage.setItem('events', JSON.stringify(events));

    alert('Evento salvo!');

    this.router.navigate(['/']);
  }
}
}