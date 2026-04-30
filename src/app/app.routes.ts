import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { EventList } from './features/events/pages/event-list/event-list';
import { EventCreate } from './features/events/pages/event-create/event-create';
import { EventDetail } from './features/events/pages/event-detail/event-detail';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { adminGuard } from './core/guards/admin-guard';
import { Dashboard } from './features/admin/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: Home },

  { path: 'events', component: EventList },

  { path: 'events/new', component: EventCreate, canActivate: [adminGuard] },

  { path: 'events/edit/:id', component: EventCreate, canActivate: [adminGuard] },

  { path: 'events/:id', component: EventDetail },

  { path: 'login', component: Login },

  { path: 'register', component: Register },

  { path: 'admin/dashboard', component: Dashboard, canActivate: [adminGuard] },

  { path: '**', redirectTo: 'home' }
];