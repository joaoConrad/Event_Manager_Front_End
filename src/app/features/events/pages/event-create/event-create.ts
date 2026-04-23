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
  successMessage = '';
  loading = false;

  minDate = '';

  constructor(
    private readonly eventService: EventService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.minDate = this.getTodayDateString();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.eventId = Number(idParam);
      this.loadEvent(this.eventId);
    }
  }

  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isPastDateTime(date: string, time: string): boolean {
    if (!date || !time) return false;

    const selected = new Date(`${date}T${time}`);
    const now = new Date();

    return selected.getTime() < now.getTime();
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
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
    this.clearMessages();

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

    if (this.isPastDateTime(this.event.date, this.event.time)) {
      this.errorMessage = 'Não é permitido criar ou editar eventos com data e hora no passado.';
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.eventId) {
      this.eventService.update(this.eventId, this.event).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Evento atualizado com sucesso.';
          setTimeout(() => this.router.navigate(['/events']), 900);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message || 'Não foi possível atualizar o evento.';
        }
      });
    } else {
      this.eventService.create(this.event).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Evento criado com sucesso.';
          setTimeout(() => this.router.navigate(['/events']), 900);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message || 'Não foi possível criar o evento.';
        }
      });
    }
  }
}