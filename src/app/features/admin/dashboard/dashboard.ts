import { Component, OnInit } from '@angular/core';
import { EventService } from '../../../core/services/event';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  events: any[] = [];

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.eventService.getEventsWithCount().subscribe(data => {
      this.events = data;
    });
  }

  getTotalGeral(): number {
    return this.events.reduce((total, event) => total + event.totalParticipants, 0);
  }
}