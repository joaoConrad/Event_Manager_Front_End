import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { EventModel } from '../../../../models/event.model';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css'
})
export class EventList {
  events: EventModel[] = [];

  constructor(private readonly eventService: EventService) {
    this.events = this.eventService
      .getAll()
      .filter(event => event.registeredParticipants < event.maxParticipants);
  }

  getAvailableSpots(event: EventModel): number {
    return event.maxParticipants - event.registeredParticipants;
  }
}