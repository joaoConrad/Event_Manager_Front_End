export interface EventModel {
  id?: number;
  title: string;
  description: string;
  date: string;
  startTime: string;   // substitui 'time' — hora de início
  endTime: string;     // novo — hora de término
  location: string;
  maxParticipants: number;
  imageUrl?: string;

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

  // legacy — mantido pra não quebrar código que ainda usa .time
  time?: string;
}