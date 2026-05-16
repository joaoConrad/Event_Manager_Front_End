export interface ParticipantModel {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  eventId?: number;
  createdAt?: string;
  isCheckedIn?: boolean;
  checkedInAt?: string;
}
