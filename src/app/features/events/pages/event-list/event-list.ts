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
  joinedEventIds = new Set<number>();
  loading = true;
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
    this.loadEvents();
  }

  ngAfterViewInit(): void {
    if (!this.loadedOnce) {
      this.loadEvents();
    }
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
        this.showFeedback('Evento excluído com sucesso.', 'success');
        this.eventToDelete = null;
        this.loadEvents();
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

  loadEvents(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.eventService.getAll().subscribe({
      next: (res) => {
        this.events = Array.isArray(res)
          ? res.map((event) => ({
              ...event,
              registeredParticipants: event.registeredParticipants ?? 0
            }))
          : [];

        this.loading = false;
        this.loadedOnce = true;
        this.cdr.detectChanges();
        this.loadJoinedState();
      },
      error: (err) => {
        console.error('Erro ao carregar eventos', err);
        this.events = [];
        this.joinedEventIds.clear();
        this.loading = false;
        this.showFeedback('Não foi possível carregar os eventos.', 'error');
      }
    });
  }

  loadJoinedState(): void {
    this.joinedEventIds.clear();

    if (!this.authService.isLoggedIn() || this.authService.isAdmin()) {
      this.cdr.detectChanges();
      return;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser?.email) {
      this.cdr.detectChanges();
      return;
    }

    this.events.forEach((event) => {
      if (!event.id) return;

      this.participantService.listByEvent(event.id).subscribe({
        next: (participants) => {
          const joined = participants.some((p) => p.email === currentUser.email);
          if (joined) this.joinedEventIds.add(event.id!);
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    });
  }

  isJoined(eventId?: number): boolean {
    return !!eventId && this.joinedEventIds.has(eventId);
  }

  getAvailableSpots(event: EventWithRegistered): number {
    return event.maxParticipants - (event.registeredParticipants ?? 0);
  }

  joinEvent(id?: number): void {
    if (!id) return;

    if (!this.authService.isLoggedIn()) {
      this.showFeedback('Você precisa estar logado para se inscrever.', 'info');
      return;
    }

    this.participantService.subscribe(id).subscribe({
      next: () => {
        this.showFeedback('Inscrição realizada com sucesso.', 'success');
        this.loadEvents();
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
        this.loadEvents();
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