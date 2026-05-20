export interface Speaker {
  id?: number;
  eventId?: number;
  name: string;
  miniBio: string;
  topics: string[];
  schedule: string;
  email?: string;
  photo?: string;
}
