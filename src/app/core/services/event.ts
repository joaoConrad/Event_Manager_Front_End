import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, forkJoin } from 'rxjs';
import { EventModel } from '../../models/event.model';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

// Envelope de resposta paginada do back
interface PaginatedResponse {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: EventModel[];
}

// Meta de paginação exposta pro componente
export interface PaginationMeta {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // URL vinda do environment — sem hardcode de localhost
  private readonly apiUrl      = `${environment.apiUrl}/events`;

  // Cache da última página buscada
  private eventsCache: EventModel[] = [];
  private lastMeta: PaginationMeta | null = null;
  private cacheValid = false;

  // ── Paginação ──────────────────────────────────────────

  /**
   * Busca uma página de eventos.
   * Quando forceRefresh=true ignora o cache.
   * Retorna um Observable com { events, meta } para o componente
   * poder exibir controles de paginação.
   */
  getPage(page = 1, limit = 10, forceRefresh = false): Observable<{ events: EventModel[]; meta: PaginationMeta }> {
    return this.http.get<PaginatedResponse>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params: { page: String(page), limit: String(limit) }
    }).pipe(
      map((res) => {
        const meta: PaginationMeta = {
          page:            res.page,
          totalPages:      res.totalPages,
          totalItems:      res.totalItems,
          hasNextPage:     res.hasNextPage,
          hasPreviousPage: res.hasPreviousPage
        };
        return { events: res.data, meta };
      }),
      tap(({ events, meta }) => {
        this.eventsCache = events;
        this.lastMeta    = meta;
        this.cacheValid  = true;
      })
    );
  }

  /**
   * Mantém compatibilidade com o código existente que chama getAll().
   * Internamente chama getPage(1, 50) e retorna só o array de eventos.
   * Quando o back implementar busca sem paginação, trocar aqui.
   */
  getAll(forceRefresh = false): Observable<EventModel[]> {
    if (!forceRefresh && this.cacheValid && this.eventsCache.length > 0) {
      return new Observable(observer => {
        observer.next(this.eventsCache);
        observer.complete();
      });
    }

    return this.http.get<PaginatedResponse>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params: { page: '1', limit: '50' }
    }).pipe(
      map((res) => res.data),
      tap((events) => {
        this.eventsCache = events;
        this.cacheValid  = true;
      })
    );
  }

  getMeta(): PaginationMeta | null {
    return this.lastMeta;
  }

  clearCache(): void {
    this.eventsCache = [];
    this.lastMeta    = null;
    this.cacheValid  = false;
  }

  // ── CRUD ───────────────────────────────────────────────

  getById(id: number): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  create(event: EventModel): Observable<EventModel> {
    return this.http.post<EventModel>(this.apiUrl, event, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  update(id: number, event: Partial<EventModel>): Observable<EventModel> {
    return this.http.put<EventModel>(`${this.apiUrl}/${id}`, event, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  // ── Dashboard ──────────────────────────────────────────

  /**
   * Busca eventos com contagem de participantes para o dashboard.
   * O back já retorna registeredParticipants em cada evento,
   * então usamos isso diretamente em vez do forkJoin antigo.
   */
  getEventsWithCount(): Observable<any[]> {
    return this.http.get<PaginatedResponse>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params: { page: '1', limit: '50' }
    }).pipe(
      map((res) => res.data.map(event => ({
        ...event,
        totalParticipants: event.registeredParticipants ?? 0
      })))
    );
  }
}