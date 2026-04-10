import { Routes } from '@angular/router';
import { EventListComponent } from './components/event-list/event-list.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { EventFormComponent } from './components/event-form/event-form.component';
import { ParticipantFormComponent } from './components/participant-form/participant-form.component';
import { ParticipantListComponent } from './components/participant-list/participant-list.component';

export const routes: Routes = [
  { path: '', component: EventListComponent },
  { path: 'create', component: EventFormComponent },
  { path: 'edit/:id', component: EventFormComponent },
  { path: 'event/:id', component: EventDetailComponent },
  { path: 'event/:id/subscribe', component: ParticipantFormComponent },
  { path: 'event/:id/participants', component: ParticipantListComponent }
];