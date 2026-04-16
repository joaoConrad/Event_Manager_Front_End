import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home';
import { EventList } from './features/events/pages/event-list/event-list';
import { EventCreate } from './features/events/pages/event-create/event-create';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';


export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home },
    { path: 'events', component: EventList },
    { path: 'events/new', component: EventCreate },
    { path: 'login', component: Login },
    { path: 'register', component: Register }
];