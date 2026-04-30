import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { AuthService } from '../../../../core/services/auth';
import { EventModel } from '../../../../models/event.model';
import { ParticipantModel } from '../../../../models/participant.model';

type FeedbackType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css'
})
export class EventDetail implements OnInit {
  event: EventModel | null = null;
  participants: ParticipantModel[] = [];

  loading = true;
  loadingParticipants = false;
  actionLoading = false;
  notFound = false;

  feedbackMessage = '';
  feedbackType: FeedbackType = 'info';
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  showDeleteModal = false;
  deleting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
    public readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(Number(idParam))) {
      this.notFound = true;
      this.loading = false;
      return;
    }
    this.loadEvent(Number(idParam));
  }

  loadEvent(id: number): void {
    this.loading = true;
    this.eventService.getById(id).subscribe({
      next: (res: any) => {
        this.event = res?.data ?? res;
        this.loading = false;

        if (this.authService.isAdmin() && this.event?.id) {
          this.loadParticipants(this.event.id);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadParticipants(eventId: number): void {
    this.loadingParticipants = true;
    this.participantService.listByEvent(eventId).subscribe({
      next: (res) => {
        this.participants = Array.isArray(res) ? res : [];
        this.loadingParticipants = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingParticipants = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── helpers ──────────────────────────────────────────

  getEventDateTime(): number {
    if (!this.event) return 0;
    return new Date(`${this.event.date}T${this.event.time}`).getTime();
  }

  isPastEvent(): boolean {
    return this.getEventDateTime() < Date.now();
  }

  getAvailableSpots(): number {
    if (!this.event) return 0;
    if (typeof this.event.availableSpots === 'number') return this.event.availableSpots;
    return Math.max(this.event.maxParticipants - (this.event.registeredParticipants ?? 0), 0);
  }

  isSoldOut(): boolean {
    if (!this.event) return true;
    if (typeof this.event.isSoldOut === 'boolean') return this.event.isSoldOut;
    return this.getAvailableSpots() <= 0;
  }

  isJoined(): boolean {
    return this.event?.isUserRegistered === true;
  }

  // ── ações ──────────────────────────────────────────

  joinEvent(): void {
    if (!this.event?.id) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.actionLoading = true;
    this.participantService.subscribe(this.event.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.showFeedback('Inscrição realizada com sucesso!', 'success');
        if (this.event) {
          this.event = {
            ...this.event,
            isUserRegistered: true,
            registeredParticipants: (this.event.registeredParticipants ?? 0) + 1
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading = false;
        this.showFeedback(err?.error?.message || 'Não foi possível concluir a inscrição.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cancelSubscription(): void {
    if (!this.event?.id) return;

    this.actionLoading = true;
    this.participantService.cancelMySubscription(this.event.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.showFeedback('Inscrição cancelada com sucesso.', 'success');
        if (this.event) {
          this.event = {
            ...this.event,
            isUserRegistered: false,
            registeredParticipants: Math.max((this.event.registeredParticipants ?? 1) - 1, 0)
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionLoading = false;
        this.showFeedback(err?.error?.message || 'Não foi possível cancelar a inscrição.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.event?.id) return;
    this.deleting = true;

    this.eventService.delete(this.event.id).subscribe({
      next: () => {
        this.deleting = false;
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.deleting = false;
        this.showFeedback(err?.error?.message || 'Não foi possível excluir o evento.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  showFeedback(message: string, type: FeedbackType): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      this.feedbackMessage = '';
      this.cdr.detectChanges();
    }, 3500);
    this.cdr.detectChanges();
  }
}