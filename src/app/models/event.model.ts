export interface EventModel {
  id?: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  imageUrl?: string;    

  registeredParticipants?: number;
  availableSpots?: number | null;
  isSoldOut?: boolean;
  isUserRegistered?: boolean;
}