export interface EventHistory {
  id: number;
  eventId: number;
  eventName: string;
  action: 'CRIADO' | 'EDITADO' | 'EXCLUÍDO';
  changedBy: string;
  changedAt: string;
  details?: string;
}
