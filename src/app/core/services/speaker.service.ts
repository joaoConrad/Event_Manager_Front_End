import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Speaker } from '../../models/speaker.model';
import { AuthService } from './auth';

export interface SpeakerPayload extends Omit<Speaker, 'id' | 'eventId'> {
  eventId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class SpeakerService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/speakers`;
  private readonly eventMapStorageKey = 'eventmanager_speaker_event_map';

  getByEvent(eventId: number): Observable<Speaker[]> {
    return this.http
      .get<Speaker[]>(this.apiUrl, {
        params: { eventId: String(eventId) }
      })
      .pipe(
        map((speakers) =>
          speakers
            .map((speaker) => this.normalizeSpeaker(speaker))
            .filter((speaker) => this.belongsToEvent(speaker, eventId))
        )
      );
  }

  create(payload: SpeakerPayload): Observable<Speaker> {
    return this.http
      .post<Speaker>(this.apiUrl, this.serializePayload(payload), {
        headers: this.authService.getAuthHeaders()
      })
      .pipe(
        map((speaker) => {
          const normalized = this.normalizeSpeaker(speaker);
          this.saveEventLink(normalized.id, payload.eventId);
          return normalized;
        })
      );
  }

  update(id: number, payload: SpeakerPayload): Observable<Speaker> {
    return this.http
      .put<Speaker>(`${this.apiUrl}/${id}`, this.serializePayload(payload), {
        headers: this.authService.getAuthHeaders()
      })
      .pipe(
        map((speaker) => {
          const normalized = this.normalizeSpeaker(speaker);
          this.saveEventLink(normalized.id ?? id, payload.eventId);
          return normalized;
        })
      );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`, {
        headers: this.authService.getAuthHeaders()
      })
      .pipe(
        map((response) => {
          this.removeEventLink(id);
          return response;
        })
      );
  }

  private normalizeSpeaker(speaker: Speaker): Speaker {
    const topics = Array.isArray(speaker.topics)
      ? speaker.topics
      : String(speaker.topics ?? '')
          .split(',')
          .map((topic) => topic.trim())
          .filter(Boolean);

    return { ...speaker, topics };
  }

  private serializePayload(payload: SpeakerPayload): Record<string, unknown> {
    return {
      ...payload,
      topics: payload.topics.join(', ')
    };
  }

  private belongsToEvent(speaker: Speaker, eventId: number): boolean {
    if (speaker.eventId != null) {
      return Number(speaker.eventId) === eventId;
    }

    const linkedEventId = this.getEventMap()[String(speaker.id)];
    return Number(linkedEventId) === eventId;
  }

  private saveEventLink(speakerId: number | undefined, eventId: number | null | undefined): void {
    if (!speakerId || !eventId) return;

    const eventMap = this.getEventMap();
    eventMap[String(speakerId)] = eventId;
    localStorage.setItem(this.eventMapStorageKey, JSON.stringify(eventMap));
  }

  private removeEventLink(speakerId: number): void {
    const eventMap = this.getEventMap();
    delete eventMap[String(speakerId)];
    localStorage.setItem(this.eventMapStorageKey, JSON.stringify(eventMap));
  }

  private getEventMap(): Record<string, number> {
    const raw = localStorage.getItem(this.eventMapStorageKey);
    if (!raw) return {};

    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
