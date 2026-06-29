import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, map, shareReplay, finalize } from 'rxjs';
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

// Envelope de resposta de criação/edição do back
interface EventResponse {
  message?: string;
  data: EventModel;
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

  private readonly apiUrl      = `${environment.apiUrl}/events`;
  private readonly apiBaseUrl  = environment.apiUrl.replace(/\/api$/, '');

  // Cache da última página buscada
  private eventsCache: EventModel[] = [];
  private lastMeta: PaginationMeta | null = null;
  private cacheValid = false;
  private allEventsRequest: Observable<EventModel[]> | null = null;

  // ── Paginação ──────────────────────────────────────────

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
        return { events: res.data.map((event) => this.normalizeEventImage(event)), meta };
      }),
      tap(({ events, meta }) => {
        this.eventsCache = events;
        this.lastMeta    = meta;
        this.cacheValid  = true;
      })
    );
  }

  getAll(forceRefresh = false): Observable<EventModel[]> {
    if (!forceRefresh && this.cacheValid && this.eventsCache.length > 0) {
      return new Observable(observer => {
        observer.next(this.eventsCache);
        observer.complete();
      });
    }

    if (!forceRefresh && this.allEventsRequest) {
      return this.allEventsRequest;
    }

    this.allEventsRequest = this.http.get<PaginatedResponse>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params: { page: '1', limit: '50' }
    }).pipe(
      map((res) => res.data.map((event) => this.normalizeEventImage(event))),
      tap((events) => {
        this.eventsCache = events;
        this.cacheValid  = true;
      }),
      finalize(() => {
        this.allEventsRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.allEventsRequest;
  }

  getMeta(): PaginationMeta | null {
    return this.lastMeta;
  }

  clearCache(): void {
    this.eventsCache = [];
    this.lastMeta    = null;
    this.cacheValid  = false;
    this.allEventsRequest = null;
  }

  // ── CRUD ───────────────────────────────────────────────

  getById(id: number): Observable<EventModel> {
    return this.http.get<EventModel | EventResponse>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map((res) => this.normalizeEventImage(('data' in res ? res.data : res)))
    );
  }

  /**
   * FIX — aceita FormData (multipart/form-data) quando há imagem.
   *
   * Quando o componente passa FormData, NÃO setamos Content-Type —
   * o browser define automaticamente com o boundary correto para que
   * o multer no backend consiga ler req.file.
   *
   * Quando não há imagem o componente pode continuar passando o objeto
   * puro (JSON), que é serializado normalmente.
   */
  create(payload: FormData | EventModel): Observable<EventModel> {
    const headers = this.buildHeaders(payload);

    return this.http.post<EventResponse>(this.apiUrl, payload, { headers }).pipe(
      tap(() => this.clearCache()),
      map((res) => this.normalizeEventImage(res.data ?? (res as unknown as EventModel)))
    );
  }

  /**
   * FIX — mesmo ajuste do create(): aceita FormData para envio de imagem.
   */
  update(id: number, payload: FormData | Partial<EventModel>): Observable<EventModel> {
    const headers = this.buildHeaders(payload);

    return this.http.put<EventResponse>(`${this.apiUrl}/${id}`, payload, { headers }).pipe(
      tap(() => this.clearCache()),
      map((res) => this.normalizeEventImage(res.data ?? (res as unknown as EventModel)))
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

  getEventsWithCount(): Observable<any[]> {
    return this.http.get<PaginatedResponse>(this.apiUrl, {
      headers: this.authService.getAuthHeaders(),
      params: { page: '1', limit: '50' }
    }).pipe(
      map((res) => res.data.map(event => ({
        ...this.normalizeEventImage(event),
        totalParticipants: event.registeredParticipants ?? 0
      })))
    );
  }

  // ── Helpers ────────────────────────────────────────────

  /**
   * Monta os headers corretos conforme o tipo do payload.
   *
   * FormData  → apenas Authorization (browser define Content-Type com boundary)
   * Objeto    → Authorization + Content-Type: application/json
   */
  private buildHeaders(payload: FormData | object): HttpHeaders {
    const token = this.authService.getToken() ?? '';

    if (payload instanceof FormData) {
      // NÃO incluir Content-Type — o browser precisa setar o boundary do multipart
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private normalizeEventImage(event: EventModel): EventModel {
    if (event.imageUrl) {
      return {
        ...event,
        imageUrl: this.normalizeAssetUrl(event.imageUrl)
      };
    }

    if (!event.imagePath) {
      return event;
    }

    return {
      ...event,
      imageUrl: this.normalizeAssetUrl(event.imagePath)
    };
  }

  private normalizeAssetUrl(value: string): string {
    const normalizedPath = value.replace(/\\/g, '/');
    const uploadsIndex = normalizedPath.lastIndexOf('uploads/');

    if (/^https?:/i.test(value)) {
      try {
        const assetUrl = new URL(normalizedPath);
        const apiUrl = new URL(this.apiBaseUrl);

        if (assetUrl.origin === apiUrl.origin && uploadsIndex !== -1) {
          return `${assetUrl.origin}/${normalizedPath.slice(uploadsIndex)}`;
        }
      } catch {
        return value;
      }

      return value;
    }

    if (/^(data:|blob:)/i.test(value)) {
      return value;
    }

    if (uploadsIndex === -1) {
      return normalizedPath;
    }

    return `${this.apiBaseUrl}/${normalizedPath.slice(uploadsIndex)}`;
  }
}
