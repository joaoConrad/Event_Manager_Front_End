import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventHistory, EventHistoryApiRow } from '../../models/history.model';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

const ACTION_TO_LABEL: Record<
  EventHistoryApiRow['action'],
  EventHistory['action']
> = {
  created: 'CRIADO',
  updated: 'EDITADO',
  deleted: 'EXCLUÍDO',
};

function formatAuthor(user?: { name: string; email: string }): string {
  if (!user) return '—';
  const { name, email } = user;
  if (name && email) return `${name} (${email})`;
  return name || email || '—';
}

function formatChangedFields(
  changed: EventHistoryApiRow['changedFields']
): string | undefined {
  if (!changed || Object.keys(changed).length === 0) return undefined;
  return Object.entries(changed)
    .map(([field, { before, after }]) => `${field}: ${String(before)} → ${String(after)}`)
    .join(' · ');
}

@Injectable({ providedIn: 'root' })
export class EventHistoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/events`;

  getByEventId(eventId: number): Observable<EventHistory[]> {
    return this.http
      .get<EventHistoryApiRow[]>(`${this.apiUrl}/${eventId}/history`, {
        headers: this.authService.getAuthHeaders(),
      })
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            action: ACTION_TO_LABEL[row.action],
            changedBy: formatAuthor(row.User ?? row.user),
            changedAt: row.createdAt,
            details: formatChangedFields(row.changedFields),
          }))
        )
      );
  }
}
