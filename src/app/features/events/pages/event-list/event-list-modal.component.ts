import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { EventHistory } from '../../../../models/history.model';
import { EventHistoryService } from '../../../../core/services/event.history';

@Component({
  selector: 'app-event-history-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="modal-card modal-history" (click)="$event.stopPropagation()">
        <div class="modal-history-header">
          <h3>Histórico de alterações</h3>
          <span class="modal-history-subtitle">{{ eventName }}</span>
        </div>

        <div class="modal-history-body">
          @if (loading) {
            <p class="history-empty">Carregando...</p>
          } @else if (error) {
            <p class="history-empty error-text">{{ error }}</p>
          } @else if (history.length === 0) {
            <p class="history-empty">Nenhuma alteração registrada para este evento.</p>
          } @else {
            <table class="history-table">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Alterado por</th>
                  <th>Data/Hora</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                @for (item of history; track item.id) {
                  <tr>
                    <td>
                      <span class="history-badge history-badge--{{ item.action.toLowerCase() }}">
                        {{ item.action }}
                      </span>
                    </td>
                    <td>{{ item.changedBy }}</td>
                    <td>{{ item.changedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ item.details || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary btn-sm" (click)="close.emit()">Fechar</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: var(--backdrop-scrim);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
        padding: 1rem;
      }

      .modal-history {
        background: var(--surface);
        border: 1px solid var(--border-strong);
        border-radius: 16px;
        width: min(980px, 100%);
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow:
          0 20px 40px rgba(2, 6, 23, 0.28),
          0 2px 10px rgba(2, 6, 23, 0.12);
      }

      .modal-history-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 1px solid var(--border-strong);
        background: linear-gradient(180deg, var(--surface-subtle) 0%, var(--surface) 100%);
      }

      .modal-history-header h3 {
        margin: 0;
        font-size: 1.3rem;
        color: var(--text);
      }

      .modal-history-subtitle {
        font-size: 0.9rem;
        color: var(--text-muted);
      }

      .modal-history-body {
        overflow-y: auto;
        flex: 1;
        padding: 0.5rem 1rem 1rem;
      }

      .history-empty {
        text-align: center;
        color: var(--text-muted);
        padding: 2rem 0;
      }

      .error-text {
        color: #c0392b;
      }

      .history-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
        font-size: 0.92rem;
      }

      .history-table th {
        text-align: left;
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 0.75rem 0.9rem;
        background: var(--surface-subtle);
        font-weight: 700;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-soft);
      }

      .history-table th:nth-child(1) {
        width: 120px;
      }

      .history-table th:nth-child(2) {
        width: 220px;
      }

      .history-table th:nth-child(3) {
        width: 170px;
      }

      .history-table td {
        padding: 0.8rem 0.9rem;
        border-bottom: 1px solid var(--border-table);
        color: var(--text);
        vertical-align: top;
        word-break: break-word;
      }

      .history-table tr:last-child td {
        border-bottom: none;
      }

      .history-table tbody tr:nth-child(even) td {
        background: var(--surface-subtle);
      }

      .history-table tr:hover td {
        background: rgba(37, 99, 235, 0.08);
      }

      .history-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 84px;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .history-badge--criado {
        background: #d4edda;
        color: #155724;
      }
      .history-badge--editado {
        background: #fff3cd;
        color: #856404;
      }
      .history-badge--excluído {
        background: #f8d7da;
        color: #721c24;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        padding: 0.9rem 1.25rem 1rem;
        border-top: 1px solid var(--border-strong);
        background: var(--surface-subtle);
      }

      @media (max-width: 768px) {
        .modal-history {
          max-height: 92vh;
        }

        .modal-history-header {
          padding: 1rem 1rem 0.85rem;
        }

        .modal-history-body {
          padding: 0.4rem 0.75rem 0.85rem;
        }

        .history-table {
          font-size: 0.84rem;
        }

        .history-table th,
        .history-table td {
          padding: 0.65rem 0.55rem;
        }

        .history-table th:nth-child(1) {
          width: 94px;
        }

        .history-table th:nth-child(2) {
          width: 160px;
        }

        .history-table th:nth-child(3) {
          width: 130px;
        }

        .history-badge {
          min-width: 74px;
          padding: 0.25rem 0.55rem;
        }
      }
    `,
  ],
})
export class EventHistoryModalComponent implements OnInit {
  @Input() eventId!: number;
  @Input() eventName!: string;
  @Output() close = new EventEmitter<void>();

  private readonly historyService = inject(EventHistoryService);

  history: EventHistory[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadHistory();
  }

  private loadHistory(): void {
    this.loading = true;
    this.error = '';

    this.historyService.getByEventId(this.eventId).subscribe({
      next: (history) => {
        this.history = history;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.history = [];
        this.loading = false;
        this.error = this.historyLoadErrorMessage(err);
      },
    });
  }

  private historyLoadErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) {
        return 'Sessão expirada ou token inválido. Faça login novamente.';
      }
      if (err.status === 403) {
        return 'Apenas administradores podem consultar o histórico de eventos.';
      }
      if (err.status === 404) {
        return 'Evento não encontrado.';
      }
      const body = err.error as { message?: string } | null;
      if (body?.message && typeof body.message === 'string') {
        return body.message;
      }
    }
    return 'Não foi possível carregar o histórico. Tente novamente.';
  }
}
