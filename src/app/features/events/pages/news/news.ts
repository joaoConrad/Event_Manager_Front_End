import { Component, OnInit } from '@angular/core';
import { News } from '../../../../models/news.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { NewsService } from '../../../../core/services/news.services';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, FormsModule],

  template: `
    <div class="container">
      <span class="page-label">AVISOS</span>
      <h2>Avisos do Evento</h2>
      <p class="page-description">
        Acompanhe comunicados importantes, atualizações e informações internas do evento.
      </p>
      <div *ngIf="isAdmin" class="form">
        <input [(ngModel)]="newTitle" placeholder="Título">
        <textarea [(ngModel)]="newContent" placeholder="Conteúdo"></textarea>
        <button type="button" (click)="addNews()">Publicar</button>
      </div>

      <div *ngFor="let news of newsList" class="news-card">
        <h3>{{ news.title }}</h3>
        <p>{{ news.content }}</p>
        <div class="card-footer">
  <small>{{ news.createdAt | date:'dd/MM/yyyy HH:mm' }}</small>

  <button *ngIf="isAdmin && news.id" (click)="removeNews(news.id!)">
    Excluir
  </button>
</div>
    </div>
  `,


  styleUrls: ['./news.css']
})
export class NewsComponent implements OnInit {

  constructor(private authService: AuthService, private newsService: NewsService, private cdr: ChangeDetectorRef) {}

  newsList: News[] = [];

  newTitle: string = '';
  newContent: string = '';

  isAdmin: boolean = true;

  ngOnInit() {
  this.isAdmin = this.authService.isAdmin();

  setTimeout(() => {
    this.loadNews();
  }, 0);
}

  loadNews() {
  this.newsService.getNews().subscribe({
    next: (data) => {
      this.newsList = data;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
    }
  });
}

  addNews() {
  if (!this.newTitle || !this.newContent) return;

  const newItem = {
    title: this.newTitle,
    content: this.newContent
  };

  console.log('clicou no botão'); // 👈 debug

  this.newsService.createNews(newItem).subscribe({
    next: (res) => {
      console.log('resposta do back:', res); // 👈 debug

      this.loadNews();

      this.newTitle = '';
      this.newContent = '';
    },
    error: (err) => {
      console.error('Erro ao criar:', err);
    }
  });
}

removeNews(id: number) {
  this.newsService.deleteNews(id).subscribe({
    next: () => {
      this.newsList = this.newsList.filter(n => n.id !== id);
    },
    error: (err) => {
      console.error('Erro ao deletar:', err);
    }
  });
}
}
