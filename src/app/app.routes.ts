import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { EventList } from './features/events/pages/event-list/event-list';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'events', component: EventList }
];