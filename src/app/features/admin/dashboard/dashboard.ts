import { Component, OnInit } from '@angular/core';
import { EventService } from '../../../core/services/event';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {

  events: any[] = [];

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.eventService.getEventsWithCount().subscribe(data => {
      this.events = data;
    });
  }
}