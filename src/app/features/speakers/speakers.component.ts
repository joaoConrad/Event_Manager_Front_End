import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Speaker } from '../../models/speaker.model';
import { SpeakerService } from '../../core/services/speaker.service';

@Component({
  selector: 'app-speakers',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './speakers.component.html',
  styleUrls: ['./speakers.component.css']
})
export class SpeakersComponent implements OnInit {
  eventId: number | null = null;
  speakers: Speaker[] = [];
  speaker: Speaker = {} as Speaker;
  topicsInput = '';
  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private speakerService: SpeakerService
  ) {}

  ngOnInit() {
    const rawEventId = this.route.snapshot.queryParamMap.get('eventId');
    this.eventId = rawEventId ? Number(rawEventId) : null;

    if (this.eventId) {
      this.loadSpeakers();
    }
  }

  save() {
    this.speaker.topics = this.topicsInput
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean);

    if (this.speaker.id) {
      this.updateSpeaker();
    } else {
      this.createSpeaker();
    }
  }

  createSpeaker() {
    if (!this.eventId) return;

    this.loading = true;
    this.errorMessage = '';
    this.speakerService.create({ ...this.speaker, eventId: this.eventId }).subscribe({
      next: () => {
        this.loading = false;
        this.resetForm();
        this.router.navigate(['/events', this.eventId]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Erro ao salvar palestrante.';
      }
    });
  }

  updateSpeaker() {
    if (!this.eventId || !this.speaker.id) return;

    this.loading = true;
    this.errorMessage = '';
    this.speakerService.update(this.speaker.id, { ...this.speaker, eventId: this.eventId }).subscribe({
      next: () => {
        this.loading = false;
        this.resetForm();
        this.loadSpeakers();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Erro ao atualizar palestrante.';
      }
    });
  }

  edit(s: Speaker) {
    this.speaker = { ...s };
    this.topicsInput = s.topics.join(', ');
  }

  delete(id: number | undefined) {
    if (!id) return;

    this.speakerService.delete(id).subscribe({
      next: () => this.speakers = this.speakers.filter(s => s.id !== id),
      error: (err) => this.errorMessage = err?.error?.message || err?.error?.error || 'Erro ao excluir palestrante.'
    });
  }

  resetForm() {
    this.speaker = {} as Speaker;
    this.topicsInput = '';
  }

  private loadSpeakers() {
    if (!this.eventId) return;

    this.loading = true;
    this.errorMessage = '';
    this.speakerService.getByEvent(this.eventId).subscribe({
      next: (speakers) => {
        this.speakers = speakers;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Erro ao carregar palestrantes.';
      }
    });
  }
}
