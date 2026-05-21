export type MaterialType = 'pdf' | 'video' | 'link' | 'image' | 'zip';

export interface MaterialModel {
  id: number;
  title: string;
  description?: string;
  type: MaterialType;
  url: string;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  releasedAt: string;
  sizeLabel?: string;
}
