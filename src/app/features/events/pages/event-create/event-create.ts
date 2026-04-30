import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event';
import { EventModel } from '../../../../models/event.model';

const LIMITS = {
  title: 100,
  description: 500,
  location: 100,
  maxParticipants: { min: 1, max: 10_000 }
} as const;

// Campos que podem ter erro de validação
type FieldError = {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  maxParticipants?: string;
  imageFile?: string;
};

@Component({
  selector: 'app-event-create',
  imports: [FormsModule, RouterLink],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css'
})
export class EventCreate implements OnInit {
  event: EventModel = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: 1
  };

  isEditMode = false;
  eventId: number | null = null;

  // Feedback geral
  errorMessage = '';
  successMessage = '';
  loading = false;
  loadingEvent = false;

  // Validação por campo
  fieldErrors: FieldError = {};
  submitted = false;

  // Imagem
  imagePreview: string | null = null;
  imageFile: File | null = null;
  readonly MAX_IMAGE_MB = 5;
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  minDate = '';

  constructor(
    private readonly eventService: EventService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.minDate = new Date().toISOString().split('T')[0];

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.eventId = Number(idParam);
      this.loadEvent(this.eventId);
    }
  }

  // ── Imagem ──────────────────────────────────────────

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fieldErrors = { ...this.fieldErrors, imageFile: undefined };

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.fieldErrors = { ...this.fieldErrors, imageFile: 'Formato inválido. Use JPG, PNG ou WebP.' };
      this.imageFile = null;
      this.imagePreview = null;
      this.cdr.detectChanges();
      return;
    }

    const maxBytes = this.MAX_IMAGE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.fieldErrors = { ...this.fieldErrors, imageFile: `A imagem deve ter no máximo ${this.MAX_IMAGE_MB}MB.` };
      this.imageFile = null;
      this.imagePreview = null;
      this.cdr.detectChanges();
      return;
    }

    this.imageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    this.fieldErrors = { ...this.fieldErrors, imageFile: undefined };
    this.cdr.detectChanges();
  }

  // ── Validação ──────────────────────────────────────

  private isPastDateTime(date: string, time: string): boolean {
    if (!date || !time) return false;
    return new Date(`${date}T${time}`).getTime() < Date.now();
  }

  private validate(): boolean {
    const errors: FieldError = {};
    const e = this.event;

    if (!e.title?.trim()) {
      errors.title = 'O título é obrigatório.';
    } else if (e.title.length > LIMITS.title) {
      errors.title = `Máximo de ${LIMITS.title} caracteres.`;
    }

    if (!e.description?.trim()) {
      errors.description = 'A descrição é obrigatória.';
    } else if (e.description.length > LIMITS.description) {
      errors.description = `Máximo de ${LIMITS.description} caracteres.`;
    }

    if (!e.date) {
      errors.date = 'A data é obrigatória.';
    }

    if (!e.time) {
      errors.time = 'O horário é obrigatório.';
    }

    if (e.date && e.time && this.isPastDateTime(e.date, e.time)) {
      errors.time = 'A data e hora não podem ser no passado.';
    }

    if (!e.location?.trim()) {
      errors.location = 'O local é obrigatório.';
    } else if (e.location.length > LIMITS.location) {
      errors.location = `Máximo de ${LIMITS.location} caracteres.`;
    }

    const vagas = Number(e.maxParticipants);
    if (!e.maxParticipants || isNaN(vagas)) {
      errors.maxParticipants = 'Informe o número de vagas.';
    } else if (vagas < LIMITS.maxParticipants.min || vagas > LIMITS.maxParticipants.max) {
      errors.maxParticipants = `Entre ${LIMITS.maxParticipants.min} e ${LIMITS.maxParticipants.max.toLocaleString('pt-BR')} vagas.`;
    }

    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  // ── Submit ──────────────────────────────────────────

  loadEvent(id: number): void {
    this.loadingEvent = true;
    this.eventService.getById(id).subscribe({
      next: (response: any) => {
        const ev = response?.data ?? response;
        this.event = {
          ...ev,
          date: ev.date?.split('T')[0] ?? ev.date,
          time: ev.time?.slice(0, 5) ?? ev.time
        };
        // Se o evento já tiver imagem salva no back, mostra preview da URL
        if (ev.imageUrl) {
          this.imagePreview = ev.imageUrl;
        }
        this.loadingEvent = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingEvent = false;
        this.errorMessage = 'Erro ao carregar evento.';
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validate()) {
      // Faz scroll pro primeiro erro visível
      setTimeout(() => {
        const el = document.querySelector('.field-error-msg');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    this.loading = true;

    // NOTA: quando o back aceitar upload de imagem, inclua o imageFile aqui via FormData
    // Exemplo: const fd = new FormData(); fd.append('image', this.imageFile); ...

    const request = this.isEditMode
      ? this.eventService.update(this.eventId!, this.event)
      : this.eventService.create(this.event);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Evento atualizado com sucesso.'
          : 'Evento criado com sucesso.';
        this.eventService.clearCache();
        setTimeout(() => this.router.navigate(['/events']), 800);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Erro ao salvar.';
        this.cdr.detectChanges();
      }
    });
  }
}