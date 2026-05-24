import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { News } from '../../models/news.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

type NewsListResponse = News[] | { data?: News[] } | { news?: News[] };
type NewsResponse = News | { data?: News };

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/news`;

  getNews(eventId?: number): Observable<News[]> {
    const params = eventId ? { eventId: String(eventId) } : undefined;
    return this.http.get<NewsListResponse>(this.apiUrl, { params }).pipe(
      map((response) => this.normalizeListResponse(response, eventId))
    );
  }

  createNews(data: Partial<News>, eventId?: number): Observable<News> {
    const payload = eventId ? { ...data, eventId } : data;
    const params = eventId ? { eventId: String(eventId) } : undefined;
    return this.http.post<NewsResponse>(this.apiUrl, payload, {
      headers: this.authService.getAuthHeaders(),
      params
    }).pipe(
      map((response) => this.normalizeItemResponse(response, eventId))
    );
  }

  deleteNews(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  private normalizeListResponse(response: NewsListResponse, eventId?: number): News[] {
    const envelope = response as { data?: News[]; news?: News[] };
    const items: News[] = Array.isArray(response)
      ? response
      : envelope.data ?? envelope.news ?? [];

    return items.map((item: News) => this.ensureEventId(item, eventId));
  }

  private normalizeItemResponse(response: NewsResponse, eventId?: number): News {
    const item = 'data' in response && response.data ? response.data : response as News;
    return this.ensureEventId(item, eventId);
  }

  private ensureEventId(news: News, eventId?: number): News {
    return eventId && !news.eventId ? { ...news, eventId } : news;
  }
}

