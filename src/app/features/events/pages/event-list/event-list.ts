import { Component } from '@angular/core';
import { EventService } from '../../../../core/services/event';
import { EventModel } from '../../../../models/event.model';

@Component({
  selector: 'app-event-list',
  imports: [],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css'
})
export class EventList {
  events: EventModel[] = [];

  constructor(private readonly eventService: EventService) {
    this.events = this.eventService.getAll();
  }
}