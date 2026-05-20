import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { News } from '../../models/news.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/news`;

  getNews(): Observable<News[]> {
    return this.http.get<News[]>(this.apiUrl);
  }

  createNews(data: Partial<News>): Observable<News> {
    return this.http.post<News>(this.apiUrl, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteNews(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
