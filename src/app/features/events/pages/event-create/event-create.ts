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

type FieldError = {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
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
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: 1,
    approvalMode: 'automatic',
    approvalRuleDescription: ''
  };

  isEditMode = false;
  eventId: number | null = null;

  errorMessage = '';
  successMessage = '';
  loading = false;
  loadingEvent = false;

  fieldErrors: FieldError = {};
  submitted = false;

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

  // ── Imagem ──────────────────────────────────────────────

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fieldErrors = { ...this.fieldErrors, imageFile: undefined };

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.fieldErrors = { ...this.fieldErrors, imageFile: 'Formato inválido. Use JPG, PNG ou WebP.' };
      this.imageFile = null; this.imagePreview = null;
      this.cdr.detectChanges(); return;
    }

    const maxBytes = this.MAX_IMAGE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.fieldErrors = { ...this.fieldErrors, imageFile: `A imagem deve ter no máximo ${this.MAX_IMAGE_MB}MB.` };
      this.imageFile = null; this.imagePreview = null;
      this.cdr.detectChanges(); return;
    }

    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.imagePreview = e.target?.result as string; this.cdr.detectChanges(); };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    this.fieldErrors = { ...this.fieldErrors, imageFile: undefined };
    this.cdr.detectChanges();
  }

  // ── Validação ────────────────────────────────────────────

  private isPast(date: string, time: string): boolean {
    if (!date || !time) return false;
    return new Date(`${date}T${time}`).getTime() < Date.now();
  }

  private validate(): boolean {
    const errors: FieldError = {};
    const e = this.event;

    if (!e.title?.trim())                               errors.title = 'O título é obrigatório.';
    else if (e.title.length > LIMITS.title)             errors.title = `Máximo de ${LIMITS.title} caracteres.`;

    if (!e.description?.trim())                         errors.description = 'A descrição é obrigatória.';
    else if (e.description.length > LIMITS.description) errors.description = `Máximo de ${LIMITS.description} caracteres.`;

    if (!e.date)                                        errors.date = 'A data é obrigatória.';

    if (!e.startTime)                                   errors.startTime = 'O horário de início é obrigatório.';
    else if (e.date && this.isPast(e.date, e.startTime)) errors.startTime = 'O horário de início não pode ser no passado.';

    if (!e.endTime)                                     errors.endTime = 'O horário de término é obrigatório.';
    else if (e.startTime && e.endTime && e.endTime <= e.startTime) errors.endTime = 'O término deve ser depois do início.';

    if (!e.location?.trim())                            errors.location = 'O local é obrigatório.';
    else if (e.location.length > LIMITS.location)       errors.location = `Máximo de ${LIMITS.location} caracteres.`;

    const vagas = Number(e.maxParticipants);
    if (!e.maxParticipants || isNaN(vagas))             errors.maxParticipants = 'Informe o número de vagas.';
    else if (vagas < LIMITS.maxParticipants.min || vagas > LIMITS.maxParticipants.max)
      errors.maxParticipants = `Entre ${LIMITS.maxParticipants.min} e ${LIMITS.maxParticipants.max.toLocaleString('pt-BR')} vagas.`;

    this.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  // ── Carrega evento pra edição ─────────────────────────────

  loadEvent(id: number): void {
    this.loadingEvent = true;
    this.eventService.getById(id).subscribe({
      next: (response: any) => {
        const ev = response?.data ?? response;
        this.event = {
          ...ev,
          date:      ev.date?.split('T')[0] ?? ev.date,
          startTime: ev.startTime?.slice(0, 5) ?? ev.startTime ?? '',
          endTime:   ev.endTime?.slice(0, 5)   ?? ev.endTime   ?? '',
          approvalMode: ev.approvalMode ?? 'automatic',
          approvalRuleDescription: ev.approvalRuleDescription ?? '',
        };
        if (ev.imageUrl) this.imagePreview = ev.imageUrl;
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

  // ── Monta payload ─────────────────────────────────────────

  /**
   * FIX — monta FormData quando há arquivo selecionado.
   *
   * O backend usa multer com .single('image'), portanto:
   *   - o arquivo deve ir no campo 'image'
   *   - os demais campos do evento vão como campos de texto no FormData
   *
   * Quando não há imagem nova, envia JSON puro (sem FormData) para
   * manter compatibilidade e não sobrescrever a imagem existente no back.
   *
   * No modo edição sem nova imagem: não envia imageUrl, o backend
   * mantém a imagem atual via: req.body.imageUrl ?? event.imageUrl
   */
  private buildPayload(): FormData | EventModel {
    if (this.imageFile) {
      const fd = new FormData();

      fd.append('title',           this.event.title);
      fd.append('description',     this.event.description);
      fd.append('date',            this.event.date);
      fd.append('startTime',       this.event.startTime);
      fd.append('endTime',         this.event.endTime);
      fd.append('location',        this.event.location);
      fd.append('maxParticipants', String(this.event.maxParticipants));
      fd.append('approvalMode',    this.event.approvalMode ?? 'automatic');
      fd.append('approvalRuleDescription', this.event.approvalRuleDescription ?? '');
      fd.append('image',           this.imageFile, this.imageFile.name);

      return fd;
    }

    // Sem imagem nova — envia JSON; no edit o back preserva a imagem atual
    const payload: EventModel = { ...this.event };

    // Remove imageUrl do payload quando o usuário removeu a imagem no form
    // para que o back limpe o campo. Caso o preview ainda exista (URL remota),
    // mantém para que o back não sobrescreva com null.
    if (!this.imagePreview) {
      payload.imageUrl = undefined;
    }

    return payload;
  }

  // ── Submit ────────────────────────────────────────────────

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validate()) {
      setTimeout(() => {
        document.querySelector('.field-error-msg')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    this.loading = true;

    const payload = this.buildPayload();

    const request = this.isEditMode
      ? this.eventService.update(this.eventId!, payload)
      : this.eventService.create(payload);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.';
        this.eventService.clearCache();
        setTimeout(() => this.router.navigate(['/events']), 800);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error?.message || err?.error?.message || 'Erro ao salvar.';
        this.cdr.detectChanges();
      }
    });
  }
}
