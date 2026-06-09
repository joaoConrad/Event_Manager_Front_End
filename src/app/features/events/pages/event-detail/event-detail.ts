import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { ParticipantService } from '../../../../core/services/participant';
import { AuthService } from '../../../../core/services/auth';
import { SpeakerService } from '../../../../core/services/speaker.service';
import { MaterialService } from '../../../../core/services/material.service';
import { EventModel } from '../../../../models/event.model';
import { ParticipantModel } from '../../../../models/participant.model';
import { MaterialModel } from '../../../../models/material.model';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NewsService } from '../../../../core/services/news.services';
import { News } from '../../../../models/news.model';

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
  newsList: News[] = [];
  materials: MaterialModel[] = [];
  newTitle = '';
  newContent = '';
  materialTitle = '';
  selectedMaterialFile: File | null = null;
  uploadingMaterial = false;
  loadingMaterials = false;
  deletingMaterialIds = new Set<number>();

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
    private readonly materialService: MaterialService,
    public readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private newsService: NewsService
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
        startDate: this.normalizeDate(raw.startDate ?? raw.date),
        endDate: this.normalizeDate(raw.endDate ?? raw.date ?? raw.startDate),
        date: this.normalizeDate(raw.startDate ?? raw.date),
        time: raw.startTime?.slice(0, 5) ?? raw.startTime,
        startTime: raw.startTime?.slice(0, 5) ?? raw.startTime,
        endTime: raw.endTime?.slice(0, 5) ?? raw.endTime,
        isCheckedIn: raw.isCheckedIn ?? false,
        approvalMode: raw.approvalMode ?? 'automatic',
        approvalRuleDescription: raw.approvalRuleDescription ?? '',
        userRegistrationApprovalStatus: raw.userRegistrationApprovalStatus
      };

      this.loadSpeakers();
      this.loadNews();

      this.loading = false;

      if (this.authService.isAdmin() && this.event?.id) {
        this.loadParticipants(this.event.id);
        this.loadMaterials();
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

  loadNews(): void {
    if (!this.event?.id) {
      this.newsList = [];
      return;
    }

    const eventId = this.event.id;
    this.newsService.getNews(eventId).subscribe({
      next: (data) => {
        this.newsList = data.filter((item) => {
          const newsEventId = this.getNewsEventId(item);
          return !newsEventId || newsEventId === eventId;
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar avisos:', err);
        this.newsList = [];
        this.cdr.detectChanges();
      }
    });
  }
  addNews(): void {
    if (!this.newTitle.trim() || !this.newContent.trim() || !this.event?.id) return;

    const eventId = this.event.id;
    const newItem: Partial<News> = {
      title: this.newTitle.trim(),
      content: this.newContent.trim(),
      eventId
    };

    this.newsService.createNews(newItem, eventId).subscribe({
      next: (res) => {
        this.newTitle = '';
        this.newContent = '';

        if (res) {
          const createdNews = {
            ...newItem,
            id: res.id,
            createdAt: res.createdAt ? new Date(res.createdAt) : new Date(),
            author: res.author
          } as News;
          this.newsList = [...this.newsList, createdNews];
        }

        this.loadNews();
      },
      error: (err) => {
        console.error('Erro ao publicar aviso:', err);
      }
    });
  }

  removeNews(id: number): void {
    this.newsService.deleteNews(id).subscribe({
      next: () => {
        this.newsList = this.newsList.filter((n) => n.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao excluir aviso:', err);
      }
    });
  }

  loadMaterials(): void {
    if (!this.event?.id || !this.authService.isAdmin()) {
      this.materials = [];
      return;
    }

    this.loadingMaterials = true;
    this.materialService.getMaterialsByEvent(this.event.id, this.event).subscribe({
      next: (materials) => {
        this.materials = materials;
        this.loadingMaterials = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingMaterials = false;
        this.showFeedback(err?.error?.message || 'Não foi possível carregar os materiais.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  onMaterialFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMaterialFile = input.files?.[0] ?? null;
  }

  uploadMaterial(): void {
    if (!this.event?.id || !this.selectedMaterialFile || this.uploadingMaterial) return;

    this.uploadingMaterial = true;
    this.materialService.uploadMaterial(this.event.id, this.materialTitle, this.selectedMaterialFile).subscribe({
      next: () => {
        this.materialTitle = '';
        this.selectedMaterialFile = null;
        this.uploadingMaterial = false;
        this.showFeedback('Material enviado com sucesso.', 'success');
        this.loadMaterials();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadingMaterial = false;
        this.showFeedback(err?.error?.message || 'Não foi possível enviar o material.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  removeMaterial(material: MaterialModel): void {
    if (!this.event?.id || this.deletingMaterialIds.has(material.id)) return;

    this.deletingMaterialIds.add(material.id);
    this.materialService.deleteMaterial(this.event.id, material.id).subscribe({
      next: () => {
        this.materials = this.materials.filter((item) => item.id !== material.id);
        this.deletingMaterialIds.delete(material.id);
        this.showFeedback('Material removido com sucesso.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingMaterialIds.delete(material.id);
        this.showFeedback(err?.error?.message || 'Não foi possível remover o material.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  downloadMaterial(material: MaterialModel): void {
    this.materialService.downloadMaterial(material).subscribe({
      next: (blob) => this.materialService.saveMaterialFile(material, blob),
      error: (err) => {
        this.showFeedback(err?.error?.message || 'Não foi possível baixar o material.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── helpers ────────────────────────────────────────────

  // date e time já normalizados no loadEvent, mas protege por garantia
  private getNewsEventId(news: News): number | null {
    const item = news as News & { event?: { id?: number | string }; event_id?: number | string };
    const rawEventId = item.eventId ?? item.event_id ?? item.event?.id;
    const eventId = Number(rawEventId);
    return Number.isNaN(eventId) ? null : eventId;
  }
  getEventDateTime(): number {
    if (!this.event) return 0;
    const date = this.normalizeDate(this.event.startDate ?? this.event.date);
    const time = this.event.startTime?.slice(0, 5) ?? this.event.startTime;
    return new Date(`${date}T${time}`).getTime();
  }

  getEventDateRange(): string {
    if (!this.event) return '';
    const startDate = this.normalizeDate(this.event.startDate ?? this.event.date);
    const endDate = this.normalizeDate(this.event.endDate ?? this.event.date ?? this.event.startDate);
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  }

  private normalizeDate(date?: string): string {
    return date?.split('T')[0] ?? '';
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
      next: (response) => {
        this.actionLoading = false;
        const approvalStatus = response?.data?.approvalStatus;
        const isManual = approvalStatus === 'pending' || this.event?.approvalMode === 'manual';
        this.showFeedback(
          isManual ? 'Inscrição enviada para aprovação.' : 'Inscrição realizada com sucesso!',
          'success'
        );
        if (this.event) {
          this.event = {
            ...this.event,
            isUserRegistered: true,
            userRegistrationApprovalStatus: approvalStatus ?? (isManual ? 'pending' : 'approved'),
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
      next: (response) => {
        Object.assign(participant, response.data ?? { approvalStatus: 'approved' });
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
      next: (response) => {
        Object.assign(participant, response.data ?? { approvalStatus: 'rejected' });
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


