/** Resposta de `GET /api/events/:id/history` (Sequelize + include User). */
export interface EventHistoryApiRow {
  id: number;
  eventId: number;
  userId: number;
  action: 'created' | 'updated' | 'deleted';
  changedFields: Record<string, { before: unknown; after: unknown }> | null;
  createdAt: string;
  User?: { name: string; email: string };
  user?: { name: string; email: string };
}

/** Linha normalizada para a UI (modal de histórico). */
export interface EventHistory {
  id: number;
  action: 'CRIADO' | 'EDITADO' | 'EXCLUÍDO';
  changedBy: string;
  changedAt: string;
  details?: string;
}
