import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../../../core/services/auth';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { EventModel } from '../../../../models/event.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user: AuthUser | null = null;
  registeredEvents: EventModel[] = [];
  loading = true;

  constructor(
    private readonly authService: AuthService,
    private readonly eventService: EventService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadRegisteredEvents();
  }

  loadRegisteredEvents(): void {
    this.loading = true;

    this.eventService.getAll(true).subscribe({
      next: (events) => {
        this.registeredEvents = events
          .filter((e) => e.isUserRegistered === true)
          .map((e) => ({
            ...e,
            startDate: this.normalizeDate(e.startDate ?? e.date),
            endDate: this.normalizeDate(e.endDate ?? e.date ?? e.startDate),
            date: this.normalizeDate(e.startDate ?? e.date),
            time: e.startTime?.slice(0, 5) ?? e.time?.slice(0, 5) ?? e.time,
            startTime: e.startTime?.slice(0, 5) ?? e.startTime,
            endTime: e.endTime?.slice(0, 5) ?? e.endTime
          }))
          .sort((a, b) => this.getDateTime(a) - this.getDateTime(b));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDateTime(event: EventModel): number {
    const date = this.normalizeDate(event.startDate ?? event.date);
    const time = event.startTime?.slice(0, 5) ?? event.time?.slice(0, 5) ?? event.time;
    return new Date(`${date}T${time}`).getTime();
  }

  getDateRange(event: EventModel): string {
    const startDate = this.normalizeDate(event.startDate ?? event.date);
    const endDate = this.normalizeDate(event.endDate ?? event.date ?? event.startDate);
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  }

  private normalizeDate(date?: string): string {
    return date?.split('T')[0] ?? '';
  }

  isPastEvent(event: EventModel): boolean {
    return this.getDateTime(event) < Date.now();
  }

  getAvailableSpots(event: EventModel): number {
    if (typeof event.availableSpots === 'number') return event.availableSpots;
    return Math.max(event.maxParticipants - (event.registeredParticipants ?? 0), 0);
  }

  getRoleLabel(): string {
    return this.user?.role === 'admin' ? 'Administrador' : 'Usuário';
  }

  getRoleBadgeClass(): string {
    return this.user?.role === 'admin' ? 'badge-admin' : 'badge-user';
  }

  getInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
