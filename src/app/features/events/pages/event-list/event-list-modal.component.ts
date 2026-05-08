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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-history {
        background: #fff;
        border-radius: 16px;
        padding: 2rem;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .modal-history-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
      }

      .modal-history-header h3 {
        margin: 0;
        font-size: 1.3rem;
        color: #1a1a2e;
      }

      .modal-history-subtitle {
        font-size: 0.85rem;
        color: #888;
      }

      .modal-history-body {
        overflow-y: auto;
        flex: 1;
        margin-bottom: 1.5rem;
      }

      .history-empty {
        text-align: center;
        color: #888;
        padding: 2rem 0;
      }

      .error-text {
        color: #c0392b;
      }

      .history-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }

      .history-table th {
        text-align: left;
        padding: 0.6rem 1rem;
        background: #f8f9fa;
        font-weight: 600;
        color: #555;
        border-bottom: 2px solid #e9ecef;
      }

      .history-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f0f0f0;
        color: #333;
        vertical-align: middle;
      }

      .history-table tr:last-child td {
        border-bottom: none;
      }

      .history-table tr:hover td {
        background: #fafafa;
      }

      .history-badge {
        padding: 0.25rem 0.7rem;
        border-radius: 20px;
        font-size: 0.75rem;
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
        padding-top: 1rem;
        border-top: 1px solid #eee;
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
