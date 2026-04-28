import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { EventModel } from '../../../../models/event.model';
import { AuthService } from '../../../../core/services/auth';

type EventWithRegistered = EventModel & { registeredParticipants?: number };
type FeedbackType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css'
})
export class EventList implements OnInit, AfterViewInit {
  events: EventWithRegistered[] = [];
  loading = true;

  private loadingStarted = false;
  private loadedOnce = false;

  feedbackMessage = '';
  feedbackType: FeedbackType = 'info';
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  showDeleteModal = false;
  eventToDelete: EventWithRegistered | null = null;
  deleting = false;

  constructor(
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
    public authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEventsOnce();
  }

  ngAfterViewInit(): void {
    this.loadEventsOnce();
  }

  loadEventsOnce(): void {
    if (this.loadingStarted || this.loadedOnce) return;

    this.loadingStarted = true;
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.eventService.getAll(true).subscribe({
      next: (res) => {
        this.events = Array.isArray(res)
          ? res.map((event) => ({
              ...event,
              registeredParticipants: event.registeredParticipants ?? 0,
              availableSpots: event.availableSpots ?? this.calculateAvailableSpots(event),
              isSoldOut: event.isSoldOut ?? this.calculateIsSoldOut(event),
              isUserRegistered: event.isUserRegistered ?? false
            }))
          : [];

        this.loading = false;
        this.loadedOnce = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar eventos', err);
        this.events = [];
        this.loading = false;
        this.loadingStarted = false;
        this.cdr.detectChanges();

        this.showFeedback('Não foi possível carregar os eventos.', 'error');
      }
    });
  }

  reloadEvents(): void {
    this.eventService.clearCache();
    this.loadingStarted = false;
    this.loadedOnce = false;
    this.loadEventsOnce();
  }

  showFeedback(message: string, type: FeedbackType): void {
    this.feedbackMessage = message;
    this.feedbackType = type;

    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }

    this.feedbackTimeout = setTimeout(() => {
      this.feedbackMessage = '';
      this.cdr.detectChanges();
    }, 3500);

    this.cdr.detectChanges();
  }

  clearFeedback(): void {
    this.feedbackMessage = '';

    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }

    this.cdr.detectChanges();
  }

  openDeleteModal(event: EventWithRegistered): void {
    this.eventToDelete = event;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal(): void {
    if (this.deleting) return;

    this.showDeleteModal = false;
    this.eventToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.eventToDelete?.id) return;

    this.deleting = true;
    this.cdr.detectChanges();

    this.eventService.delete(this.eventToDelete.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.eventToDelete = null;

        this.showFeedback('Evento excluído com sucesso.', 'success');
        this.reloadEvents();
      },
      error: (err) => {
        console.error('Erro ao excluir evento', err);
        this.deleting = false;
        this.showFeedback(
          err?.error?.message || 'Não foi possível excluir o evento.',
          'error'
        );
        this.cdr.detectChanges();
      }
    });
  }

  getAvailableEvents(): EventWithRegistered[] {
    if (this.authService.isAdmin()) {
      return this.events;
    }

    return this.events.filter((event) => {
      return !this.isSoldOut(event) || this.isJoined(event.id);
    });
  }

  getSoldOutEvents(): EventWithRegistered[] {
    if (this.authService.isAdmin()) {
      return [];
    }

    return this.events.filter((event) => {
      return this.isSoldOut(event) && !this.isJoined(event.id);
    });
  }

  isJoined(eventId?: number): boolean {
    if (!eventId) return false;

    const event = this.events.find((item) => item.id === eventId);

    return event?.isUserRegistered === true;
  }

  calculateAvailableSpots(event: EventWithRegistered): number {
    return Math.max(event.maxParticipants - (event.registeredParticipants ?? 0), 0);
  }

  calculateIsSoldOut(event: EventWithRegistered): boolean {
    return this.calculateAvailableSpots(event) <= 0;
  }

  getAvailableSpots(event: EventWithRegistered): number {
    if (typeof event.availableSpots === 'number') {
      return event.availableSpots;
    }

    return this.calculateAvailableSpots(event);
  }

  isSoldOut(event: EventWithRegistered): boolean {
    if (typeof event.isSoldOut === 'boolean') {
      return event.isSoldOut;
    }

    return this.calculateIsSoldOut(event);
  }

  joinEvent(id?: number): void {
    if (!id) return;

    const event = this.events.find((item) => item.id === id);

    if (event && this.isSoldOut(event)) {
      this.showFeedback('Este evento está esgotado.', 'info');
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.showFeedback('Você precisa estar logado para se inscrever.', 'info');
      return;
    }

    this.participantService.subscribe(id).subscribe({
      next: () => {
        this.showFeedback('Inscrição realizada com sucesso.', 'success');
        this.reloadEvents();
      },
      error: (err) => {
        console.error('Erro ao inscrever', err);
        this.showFeedback(
          err?.error?.message || 'Não foi possível concluir a inscrição.',
          'error'
        );
      }
    });
  }

  cancelSubscription(id?: number): void {
    if (!id) return;

    this.participantService.cancelMySubscription(id).subscribe({
      next: () => {
        this.showFeedback('Inscrição cancelada com sucesso.', 'success');
        this.reloadEvents();
      },
      error: (err) => {
        console.error('Erro ao cancelar', err);
        this.showFeedback(
          err?.error?.message || 'Não foi possível cancelar a inscrição.',
          'error'
        );
      }
    });
  }
}