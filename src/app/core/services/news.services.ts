import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { News } from '../../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  private apiUrl = 'http://localhost:3000/api/news';

  constructor(private http: HttpClient) {}

  getNews(): Observable<News[]> {
    return this.http.get<News[]>(this.apiUrl);
  }

  createNews(data: Partial<News>): Observable<News> {
    return this.http.post<News>(this.apiUrl, data);
  }

  deleteNews(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
