import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  loadingEvent = false;

  minDate = '';

  constructor(
    private readonly eventService: EventService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
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
    return today.toISOString().split('T')[0];
  }

  isPastDateTime(date: string, time: string): boolean {
    if (!date || !time) return false;

    const selected = new Date(`${date}T${time}`);
    return selected.getTime() < new Date().getTime();
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  loadEvent(id: number): void {
    this.loadingEvent = true;

    this.eventService.getById(id).subscribe({
      next: (response: any) => {
        const event = response?.data ?? response;

        this.event = {
          ...event,
          date: event.date?.split('T')[0] ?? event.date,
          time: event.time?.slice(0, 5) ?? event.time
        };

        this.loadingEvent = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingEvent = false;
        this.errorMessage = 'Erro ao carregar evento.';
        this.cdr.detectChanges();
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
      this.errorMessage = 'Data/hora não pode ser no passado.';
      return;
    }

    this.loading = true;

    const request = this.isEditMode
      ? this.eventService.update(this.eventId!, this.event)
      : this.eventService.create(this.event);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Evento atualizado com sucesso.'
          : 'Evento criado com sucesso.';

        this.eventService.clearCache();

        setTimeout(() => this.router.navigate(['/events']), 800);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Erro ao salvar.';
        this.cdr.detectChanges();
      }
    });
  }
}