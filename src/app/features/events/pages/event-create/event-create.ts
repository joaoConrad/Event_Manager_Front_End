import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { EventModel } from '../../../../models/event.model';

@Component({
  selector: 'app-event-create',
  imports: [FormsModule, RouterLink],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css'
})
export class EventCreate implements OnInit {
  event: EventModel = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: 1
  };

  isEditMode = false;
  eventId: number | null = null;
  errorMessage = '';
  loading = false;

  constructor(
    private readonly eventService: EventService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.eventId = Number(idParam);
      this.loadEvent(this.eventId);
    }
  }

  loadEvent(id: number): void {
    this.eventService.getById(id).subscribe({
      next: (event) => {
        this.event = {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          maxParticipants: event.maxParticipants
        };
      },
      error: (err) => {
        console.error('Erro ao carregar evento', err);
        this.errorMessage = err?.error?.message || 'Não foi possível carregar o evento.';
      }
    });
  }

  submit(): void {
    this.errorMessage = '';

    if (
      !this.event.title ||
      !this.event.description ||
      !this.event.date ||
      !this.event.time ||
      !this.event.location ||
      !this.event.maxParticipants
    ) {
      this.errorMessage = 'Preencha todos os campos.';
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.eventId) {
      this.eventService.update(this.eventId, this.event).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/events']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.message || 'Não foi possível atualizar o evento.';
        }
      });
    } else {
      this.eventService.create(this.event).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/events']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.message || 'Não foi possível criar o evento.';
        }
      });
    }
  }
}