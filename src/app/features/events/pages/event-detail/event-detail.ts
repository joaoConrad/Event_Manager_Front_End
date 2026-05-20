import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { AuthService } from '../../../../core/services/auth';
import { SpeakerService } from '../../../../core/services/speaker.service';
import { EventModel } from '../../../../models/event.model';
import { ParticipantModel } from '../../../../models/participant.model';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';

type FeedbackType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, CommonModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css'
})
export class EventDetail implements OnInit {

  selectedSpeaker: any = null;

  openSpeaker(s: any) {
    this.selectedSpeaker = s;
  }

  closeSpeaker() {
    this.selectedSpeaker = null;
  }

  event: EventModel | null = null;
  participants: ParticipantModel[] = [];
  searchParticipant = '';
  filteredParticipants: any[] = [];

  loading = true;
  loadingParticipants = false;
  actionLoading = false;
  approvalLoadingIds = new Set<number>();
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
    private readonly speakerService: SpeakerService,
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
    this.loadSpeakers();
  }

  loadEvent(id: number): void {
  this.loading = true;

  this.eventService.getById(id).subscribe({
    next: (res: any) => {
      const raw = res?.data ?? res;

      this.event = {
        ...raw,
        date: raw.date?.split('T')[0] ?? raw.date,
        time: raw.startTime?.slice(0, 5) ?? raw.startTime,
        isCheckedIn: raw.isCheckedIn ?? false,
        approvalMode: raw.approvalMode ?? 'automatic',
        approvalRuleDescription: raw.approvalRuleDescription ?? '',
        userRegistrationApprovalStatus: raw.userRegistrationApprovalStatus
      };

      this.loadSpeakers();

      this.loading = false;

      if (this.authService.isAdmin() && this.event?.id) {
        this.loadParticipants(this.event.id);
      }

      this.cdr.detectChanges();
    }
  });
}

  loadParticipants(eventId: number): void {
    this.loadingParticipants = true;
    this.participantService.listByEvent(eventId).subscribe({
      next: (res) => {
        console.log(res); //

        this.participants = Array.isArray(res) ? res : [];
        this.filteredParticipants = this.participants;
        this.sortParticipants('name');
        this.loadingParticipants = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingParticipants = false;
        this.cdr.detectChanges();
        }
    });
  }

  // ── helpers ────────────────────────────────────────────

  // date e time já normalizados no loadEvent, mas protege por garantia
  getEventDateTime(): number {
    if (!this.event) return 0;
    const date = this.event.date?.split('T')[0] ?? this.event.date;
    const time = this.event.startTime?.slice(0, 5) ?? this.event.startTime;
    return new Date(`${date}T${time}`).getTime();
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

  isManualApproval(): boolean {
    return this.event?.approvalMode === 'manual';
  }

  getUserApprovalStatus(): string {
    if (!this.isJoined()) return '';
    return this.event?.userRegistrationApprovalStatus ?? 'approved';
  }

  isUserPendingApproval(): boolean {
    return this.getUserApprovalStatus() === 'pending';
  }

  getParticipantApprovalStatus(participant: ParticipantModel): string {
    return participant.approvalStatus ?? 'approved';
  }

  getPendingParticipantsCount(): number {
    return this.participants.filter((p) => this.getParticipantApprovalStatus(p) === 'pending').length;
  }

  // ── ações ──────────────────────────────────────────────

  joinEvent(): void {
    if (!this.event?.id) return;
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); return; }

    this.actionLoading = true;
    this.participantService.subscribe(this.event.id).subscribe({
      next: () => {
        this.actionLoading = false;
        const isManual = this.event?.approvalMode === 'manual';
        this.showFeedback(
          isManual ? 'Inscrição enviada para aprovação.' : 'Inscrição realizada com sucesso!',
          'success'
        );
        if (this.event) {
          this.event = {
            ...this.event,
            isUserRegistered: true,
            userRegistrationApprovalStatus: isManual ? 'pending' : 'approved',
            registeredParticipants: isManual
              ? (this.event.registeredParticipants ?? 0)
              : (this.event.registeredParticipants ?? 0) + 1
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
            userRegistrationApprovalStatus: undefined,
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

  openDeleteModal(): void { this.showDeleteModal = true; }

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

  filterParticipant() {
  this.filteredParticipants = this.participants.filter(p =>
    p.name.toLowerCase().includes(this.searchParticipant.toLowerCase())
  );

  if (this.filteredParticipants.length === 0) {
    console.log("Nenhum participante encontrado");
  }
  }

  sortParticipants(type: string) {
    if (type === 'name') {
      this.filteredParticipants.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    if (type === 'date') {
      this.filteredParticipants.sort((a, b) =>
        new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
      );
    }

    if (type === 'status') {
      this.filteredParticipants.sort((a, b) =>
        this.getParticipantApprovalStatus(a).localeCompare(this.getParticipantApprovalStatus(b))
      );
    }
  }

  approveParticipant(participant: ParticipantModel): void {
    if (!this.event?.id || !participant.id) return;

    this.approvalLoadingIds.add(participant.id);
    this.participantService.approve(this.event.id, participant.id).subscribe({
      next: () => {
        participant.approvalStatus = 'approved';
        participant.approvedAt = new Date().toISOString();
        this.approvalLoadingIds.delete(participant.id!);
        this.showFeedback('Inscrição aprovada.', 'success');
        this.loadParticipants(this.event!.id!);
      },
      error: (err) => {
        this.approvalLoadingIds.delete(participant.id!);
        this.showFeedback(err?.error?.message || 'Não foi possível aprovar a inscrição.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  rejectParticipant(participant: ParticipantModel): void {
    if (!this.event?.id || !participant.id) return;

    this.approvalLoadingIds.add(participant.id);
    this.participantService.reject(this.event.id, participant.id).subscribe({
      next: () => {
        participant.approvalStatus = 'rejected';
        participant.rejectedAt = new Date().toISOString();
        this.approvalLoadingIds.delete(participant.id!);
        this.showFeedback('Inscrição recusada.', 'success');
        this.loadParticipants(this.event!.id!);
      },
      error: (err) => {
        this.approvalLoadingIds.delete(participant.id!);
        this.showFeedback(err?.error?.message || 'Não foi possível recusar a inscrição.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  speakers: any[] = [];

  loadSpeakers() {
    if (!this.event?.id) return;

    this.speakerService.getByEvent(this.event.id).subscribe({
      next: (speakers) => {
        this.speakers = speakers;
        this.cdr.detectChanges();
      },
      error: () => {
        this.speakers = [];
        this.cdr.detectChanges();
      }
    });
}

deleteSpeaker(id: number) {
  if (!this.authService.isAdmin()) return;

  const confirmDelete = confirm('Deseja excluir este palestrante?');

  if (!confirmDelete) return;

  this.speakerService.delete(id).subscribe({
    next: () => this.loadSpeakers(),
    error: (err) => this.showFeedback(err?.error?.message || err?.error?.error || 'Não foi possível excluir o palestrante.', 'error')
  });
}

}
