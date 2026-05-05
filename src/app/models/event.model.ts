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

  // soft delete
  deletedAt?: string | null;

  // legacy — mantido pra não quebrar código que ainda usa .time
  time?: string;
}