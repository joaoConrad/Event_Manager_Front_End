import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { AuthService } from '../../../../core/services/auth';
import { EventModel } from '../../../../models/event.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit {
  events: EventModel[] = [];
  loading = true;

  private loadingStarted = false;
  private loadedOnce = false;

  @ViewChild('carousel', { static: false })
  carouselRef?: ElementRef<HTMLDivElement>;

  constructor(
    private readonly eventService: EventService,
    public authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEventsOnce();
  }

  ngAfterViewInit(): void {
    this.loadEventsOnce();
  }

  loadEventsOnce(): void {
    if (this.loadingStarted || this.loadedOnce) return;
    this.loadingStarted = true;
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.eventService.getAll().subscribe({
      next: (res) => {
        this.events = Array.isArray(res)
          ? res
              .filter((event) => !this.isPastEvent(event))
              .sort((a, b) => this.getEventDateTime(a) - this.getEventDateTime(b))
              .slice(0, 8)
          : [];

        this.loading = false;
        this.loadedOnce = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar eventos da home', err);
        this.events = [];
        this.loading = false;
        this.loadingStarted = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollCarousel(direction: 'left' | 'right'): void {
    const container = this.carouselRef?.nativeElement;
    if (!container) return;
    const amount = Math.round(container.clientWidth * 0.85);
    container.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  // ── fix: normaliza date e time antes de montar a data ──
  getEventDateTime(event: EventModel): number {
    const date = event.date?.split('T')[0] ?? event.date;
    const time = event.startTime?.slice(0, 5) ?? event.startTime;
    return new Date(`${date}T${time}`).getTime();
  }

  isPastEvent(event: EventModel): boolean {
    return this.getEventDateTime(event) < Date.now();
  }

  getAvailableSpots(event: EventModel): number {
    if (typeof event.availableSpots === 'number') return event.availableSpots;
    return Math.max(event.maxParticipants - (event.registeredParticipants ?? 0), 0);
  }

  isSoldOut(event: EventModel): boolean {
    if (typeof event.isSoldOut === 'boolean') return event.isSoldOut;
    return this.getAvailableSpots(event) <= 0;
  }
}