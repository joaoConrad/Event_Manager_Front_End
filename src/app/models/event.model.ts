import type { RegistrationApprovalStatus } from './participant.model';

export type RegistrationApprovalMode = 'automatic' | 'manual';

export interface EventModel {
  id?: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  imageUrl?: string;
  imagePath?: string | null;

  // aprovacao de inscricoes
  approvalMode?: RegistrationApprovalMode;
  approvalRuleDescription?: string;
  userRegistrationApprovalStatus?: RegistrationApprovalStatus;

  // calculados pelo back
  registeredParticipants?: number;
  availableSpots?: number | null;
  isSoldOut?: boolean;
  isUserRegistered?: boolean;

  // FIX: indica se o usuário logado já fez check-in neste evento.
  // Retornado pelo back em getAllEvents e getEventById.
  // Usado para ocultar o botão "Cancelar inscrição" após o check-in.
  isCheckedIn?: boolean;

  // soft delete
  deletedAt?: string | null;

  // legacy/compatibilidade com respostas antigas do back
  date?: string;
  time?: string;
}
