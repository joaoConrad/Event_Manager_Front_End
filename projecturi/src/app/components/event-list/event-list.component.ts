import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent {

  events: any[] = [];

  constructor() {
    this.loadEvents();
  }

  loadEvents() {
    if (typeof window !== 'undefined') {
      this.events = JSON.parse(localStorage.getItem('events') || '[]');
    }
  }

  deleteEvent(id: number) {
    if (typeof window !== 'undefined') {
      this.events = this.events.filter(e => e.id !== id);
      localStorage.setItem('events', JSON.stringify(this.events));
    }
  }
}