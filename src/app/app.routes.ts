import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { EventList } from './features/events/pages/event-list/event-list';
import { EventCreate } from './features/events/pages/event-create/event-create';
import { EventDetail } from './features/events/pages/event-detail/event-detail';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { Profile } from './features/auth/pages/profile/profile';
import { QrCheckin } from './features/events/pages/qr-checkin/qr-checkin';
import { NotFound } from './features/shared/not-found/not-found';
import { adminGuard } from './core/guards/admin-guard';
import { authGuard } from './core/guards/auth-guard';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { NewsComponent } from './features/events/pages/news/news';
import { SpeakersComponent } from './features/speakers/speakers.component';
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home',     component: Home },
  { path: 'events',   component: EventList },

  // rotas específicas ANTES de :id
  { path: 'events/new',        component: EventCreate, canActivate: [adminGuard] },
  { path: 'events/edit/:id',   component: EventCreate, canActivate: [adminGuard] },
  { path: 'events/:id',        component: EventDetail },
  { path: 'events/:id/checkin', component: QrCheckin },

  { path: 'login',    component: Login },
  { path: 'register', component: Register },

  // perfil — só usuário logado
  { path: 'profile', component: Profile, canActivate: [authGuard] },

  // dashboard — só admin
  { path: 'admin/dashboard', component: Dashboard, canActivate: [adminGuard] },

  // avisos — lista de notícias internas do sistema
  { path: 'news', component: NewsComponent },

  // palestrantes — cadastro, edição e listagem de palestrantes do evento
  { path: 'speakers', component: SpeakersComponent },

  // 404 — deve ser a última
  { path: '**', component: NotFound }
];
