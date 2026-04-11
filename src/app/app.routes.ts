import { Routes } from '@angular/router';
import { EventList } from './features/events/pages/event-list/event-list';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  { path: 'events', component: EventList }
];