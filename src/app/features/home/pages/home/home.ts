import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { AuthService } from '../../../../core/services/auth';
import { EventModel } from '../../../../models/event.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  events: EventModel[] = [];
  loading = true;

  constructor(
    private readonly eventService: EventService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;

    this.eventService.getAll().subscribe({
      next: (res) => {
        this.events = Array.isArray(res) ? res.slice(0, 3) : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar eventos da home', err);
        this.events = [];
        this.loading = false;
      }
    });
  }
}