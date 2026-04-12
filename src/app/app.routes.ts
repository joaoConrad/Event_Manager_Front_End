import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { EventList } from './features/events/pages/event-list/event-list';
import { EventCreate } from './features/events/pages/event-create/event-create';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home },
    { path: 'events', component: EventList },
    { path: 'events/new', component: EventCreate }
];