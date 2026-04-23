import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { EventModel } from '../../../../models/event.model';
import { AuthService } from '../../../../core/services/auth';

type EventWithRegistered = EventModel & { registeredParticipants?: number };

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
        this.cdr.detectChanges();
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
      alert('Você precisa estar logado para se inscrever.');
      return;
    }

    this.participantService.subscribe(id).subscribe({
      next: () => {
        alert('Inscrição realizada com sucesso!');
        this.loadEvents();
      },
      error: (err) => {
        console.error('Erro ao inscrever', err);
        alert(err?.error?.message || 'Não foi possível concluir a inscrição.');
      }
    });
  }

  cancelSubscription(id?: number): void {
    if (!id) return;

    this.participantService.cancelMySubscription(id).subscribe({
      next: () => {
        alert('Inscrição cancelada com sucesso!');
        this.loadEvents();
      },
      error: (err) => {
        console.error('Erro ao cancelar', err);
        alert(err?.error?.message || 'Não foi possível cancelar a inscrição.');
      }
    });
  }

  deleteEvent(id?: number): void {
    if (!id) return;
    if (!confirm('Deseja excluir este evento?')) return;

    this.eventService.delete(id).subscribe({
      next: () => this.loadEvents(),
      error: (err) => {
        console.error('Erro ao excluir evento', err);
        alert(err?.error?.message || 'Não foi possível excluir o evento.');
      }
    });
  }
}