import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService, PaginationMeta } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { EventModel } from '../../../../models/event.model';
import { AuthService } from '../../../../core/services/auth';
import { EventHistoryModalComponent } from './event-list-modal.component';

type EventWithRegistered = EventModel & { registeredParticipants?: number };
type FeedbackType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [RouterLink, FormsModule, EventHistoryModalComponent],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList implements OnInit {
  filtroData = '';
  filtroCategoria = '';
  filtroStatus = '';

  events: EventWithRegistered[] = [];
  loading = true;
  sortOrder: 'recent' | 'oldest' = 'recent';

  // ── Paginação ──────────────────────────────────────────
  currentPage = 1;
  readonly pageSize = 10;
  pagination: PaginationMeta | null = null;

  showPastEvents = false;
  manualJoinedEventIds = new Set<number>();

  feedbackMessage = '';
  feedbackType: FeedbackType = 'info';
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  showDeleteModal = false;
  eventToDelete: EventWithRegistered | null = null;
  deleting = false;

  showHistoryModal = false;
  historyEventId: number | null = null;
  historyEventName = '';

  constructor(
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
    public readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  // ── Carregamento ───────────────────────────────────────

  loadEvents(): void {
    this.loading = true;

    this.eventService.getPage(this.currentPage, this.pageSize).subscribe({
      next: ({ events, meta }) => {
        this.events = events.map((event) => ({
          ...event,
          date: event.date?.split('T')[0] ?? event.date,
          time: event.time?.slice(0, 5) ?? event.time,
          registeredParticipants: event.registeredParticipants ?? 0,
          availableSpots: event.availableSpots ?? this.calcSpots(event),
          isSoldOut: event.isSoldOut ?? this.calcSoldOut(event),
          isUserRegistered: event.isUserRegistered ?? false,
        }));

        this.pagination = meta;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.events = [];
        this.loading = false;
        this.showFeedback('Não foi possível carregar os eventos.', 'error');
      },
    });
  }

  reloadEvents(): void {
    this.eventService.clearCache();
    this.loadEvents();
  }

  // ── Paginação ──────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    if (page === this.currentPage) return;
    this.currentPage = page;
    this.manualJoinedEventIds.clear(); // limpa inscrições locais ao trocar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadEvents();
  }

  prevPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  // gera array de números de página para o template
  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    const total = this.pagination.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // janela deslizante: sempre mostra 1, ..., atual-1, atual, atual+1, ..., total
    const pages: number[] = [1];

    if (current > 3) pages.push(-1); // -1 = reticências

    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push(-1);

    pages.push(total);
    return pages;
  }

  // ── Ordenação ──────────────────────────────────────────

  setSortOrder(order: 'recent' | 'oldest'): void {
    this.sortOrder = order;
  }

  private sortEvents(events: EventWithRegistered[]): EventWithRegistered[] {
    return [...events].sort((a, b) => {
      const diff = this.getDateTime(a) - this.getDateTime(b);
      return this.sortOrder === 'recent' ? diff : -diff;
    });
  }

  // ── Filtros (client-side sobre a página atual) ─────────

  private applyFilters(events: EventWithRegistered[]): EventWithRegistered[] {
    return events.filter((event) => {
      const matchData    = this.filtroData      ? event.date === this.filtroData : true;
      const matchTitulo  = this.filtroCategoria ? event.title.toLowerCase().includes(this.filtroCategoria.toLowerCase()) : true;
      const matchStatus  = this.filtroStatus    ? this.getStatus(event) === this.filtroStatus : true;
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
    const base = this.events.filter(
      (e) => !this.isPastEvent(e) && this.isSoldOut(e) && !this.isJoined(e.id),
    );
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

  // ── Helpers de data/estado ─────────────────────────────

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

  // ── Ações ──────────────────────────────────────────────

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
      error: (err) => this.showFeedback(err?.error?.message || 'Não foi possível concluir a inscrição.', 'error'),
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
      error: (err) => this.showFeedback(err?.error?.message || 'Não foi possível cancelar a inscrição.', 'error'),
    });
  }

  // ── Modais ─────────────────────────────────────────────

  openHistoryModal(event: EventWithRegistered): void {
    this.historyEventId = event.id ?? null;
    this.historyEventName = event.title;
    this.showHistoryModal = true;
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.historyEventId = null;
    this.historyEventName = '';
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
      },
    });
  }

  // ── Feedback ───────────────────────────────────────────

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