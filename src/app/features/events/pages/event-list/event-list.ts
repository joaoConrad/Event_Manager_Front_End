import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { EventModel } from '../../../../models/event.model';
import { AuthService } from '../../../../core/services/auth';

type EventWithRegistered = EventModel & { registeredParticipants?: number };
type FeedbackType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css'
})
export class EventList implements OnInit {

  filtroData = '';
  filtroCategoria = '';
  filtroStatus = '';

  events: EventWithRegistered[] = [];
  loading = true;
  sortOrder: 'recent' | 'oldest' = 'recent';

  showPastEvents = false;
  manualJoinedEventIds = new Set<number>();

  feedbackMessage = '';
  feedbackType: FeedbackType = 'info';
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  showDeleteModal = false;
  eventToDelete: EventWithRegistered | null = null;
  deleting = false;

  constructor(
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
    public readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;

    this.eventService.getAll(true).subscribe({
      next: (res) => {
        this.events = Array.isArray(res)
          ? res.map((event) => ({
              ...event,
              // fix: normaliza date/time que podem vir como ISO do banco
              date: event.date?.split('T')[0] ?? event.date,
              time: event.time?.slice(0, 5) ?? event.time,
              registeredParticipants: event.registeredParticipants ?? 0,
              availableSpots: event.availableSpots ?? this.calcSpots(event),
              isSoldOut: event.isSoldOut ?? this.calcSoldOut(event),
              isUserRegistered: event.isUserRegistered ?? false
            }))
          : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.events = [];
        this.loading = false;
        this.showFeedback('Não foi possível carregar os eventos.', 'error');
      }
    });
  }

  reloadEvents(): void {
    this.eventService.clearCache();
    this.loadEvents();
  }

  setSortOrder(order: 'recent' | 'oldest'): void { this.sortOrder = order; }

  private sortEvents(events: EventWithRegistered[]): EventWithRegistered[] {
    return [...events].sort((a, b) => {
      const diff = this.getDateTime(a) - this.getDateTime(b);
      return this.sortOrder === 'recent' ? diff : -diff;
    });
  }

  private applyFilters(events: EventWithRegistered[]): EventWithRegistered[] {
    return events.filter((event) => {
      const matchData   = this.filtroData      ? event.date === this.filtroData : true;
      const matchTitulo = this.filtroCategoria ? event.title.toLowerCase().includes(this.filtroCategoria.toLowerCase()) : true;
      const matchStatus = this.filtroStatus    ? this.getStatus(event) === this.filtroStatus : true;
      return matchData && matchTitulo && matchStatus;
    });
  }

  getAvailableEvents(): EventWithRegistered[] {
    const base = this.events.filter((e) => {
      if (this.isPastEvent(e)) return false;
      if (this.authService.isAdmin()) return true;
      return !this.isSoldOut(e) || this.isJoined(e.id);
    });
    return this.sortEvents(this.applyFilters(base));
  }

  getSoldOutEvents(): EventWithRegistered[] {
    if (this.authService.isAdmin()) return [];
    const base = this.events.filter((e) => !this.isPastEvent(e) && this.isSoldOut(e) && !this.isJoined(e.id));
    return this.sortEvents(this.applyFilters(base));
  }

  getPastEvents(): EventWithRegistered[] {
    return this.sortEvents(this.applyFilters(this.events.filter((e) => this.isPastEvent(e))));
  }

  aplicarFiltro(): void { this.cdr.detectChanges(); }

  limparFiltro(): void {
    this.filtroData = '';
    this.filtroCategoria = '';
    this.filtroStatus = '';
    this.cdr.detectChanges();
  }

  getStatus(event: EventWithRegistered): string {
    if (this.isPastEvent(event) || this.isSoldOut(event)) return 'cancelado';
    return 'ativo';
  }

  togglePastEvents(): void { this.showPastEvents = !this.showPastEvents; }

  // date e time já normalizados no loadEvents, mas protege por garantia
  getDateTime(event: EventWithRegistered): number {
    const date = event.date?.split('T')[0] ?? event.date;
    const time = event.time?.slice(0, 5) ?? event.time;
    return new Date(`${date}T${time}`).getTime();
  }

  isPastEvent(event: EventWithRegistered): boolean {
    return this.getDateTime(event) < Date.now();
  }

  calcSpots(event: EventWithRegistered): number {
    return Math.max(event.maxParticipants - (event.registeredParticipants ?? 0), 0);
  }

  calcSoldOut(event: EventWithRegistered): boolean { return this.calcSpots(event) <= 0; }

  getAvailableSpots(event: EventWithRegistered): number {
    return typeof event.availableSpots === 'number' ? event.availableSpots : this.calcSpots(event);
  }

  isSoldOut(event: EventWithRegistered): boolean {
    return typeof event.isSoldOut === 'boolean' ? event.isSoldOut : this.calcSoldOut(event);
  }

  isJoined(eventId?: number): boolean {
    if (!eventId) return false;
    const event = this.events.find((e) => e.id === eventId);
    return event?.isUserRegistered === true || this.manualJoinedEventIds.has(eventId);
  }

  joinEvent(id?: number): void {
    if (!id) return;
    const event = this.events.find((e) => e.id === id);
    if (event && this.isPastEvent(event)) { this.showFeedback('Este evento já foi encerrado.', 'info'); return; }
    if (event && this.isSoldOut(event))   { this.showFeedback('Este evento está esgotado.', 'info'); return; }
    if (!this.authService.isLoggedIn())   { this.showFeedback('Você precisa estar logado para se inscrever.', 'info'); return; }

    this.participantService.subscribe(id).subscribe({
      next: () => {
        this.manualJoinedEventIds.add(id);
        this.showFeedback('Inscrição realizada com sucesso.', 'success');
        this.reloadEvents();
      },
      error: (err) => this.showFeedback(err?.error?.message || 'Não foi possível concluir a inscrição.', 'error')
    });
  }

  cancelSubscription(id?: number): void {
    if (!id) return;
    this.participantService.cancelMySubscription(id).subscribe({
      next: () => {
        this.manualJoinedEventIds.delete(id);
        this.showFeedback('Inscrição cancelada com sucesso.', 'success');
        this.reloadEvents();
      },
      error: (err) => this.showFeedback(err?.error?.message || 'Não foi possível cancelar a inscrição.', 'error')
    });
  }

  openDeleteModal(event: EventWithRegistered): void {
    this.eventToDelete = event;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
    this.eventToDelete = null;
  }

  confirmDelete(): void {
    if (!this.eventToDelete?.id) return;
    this.deleting = true;

    this.eventService.delete(this.eventToDelete.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.eventToDelete = null;
        this.showFeedback('Evento excluído com sucesso.', 'success');
        this.reloadEvents();
      },
      error: (err) => {
        this.deleting = false;
        this.showFeedback(err?.error?.message || 'Não foi possível excluir o evento.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  showFeedback(message: string, type: FeedbackType): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      this.feedbackMessage = '';
      this.cdr.detectChanges();
    }, 3500);
    this.cdr.detectChanges();
  }

  clearFeedback(): void {
    this.feedbackMessage = '';
    if (this.feedbackTimeout) { clearTimeout(this.feedbackTimeout); this.feedbackTimeout = null; }
    this.cdr.detectChanges();
  }
}