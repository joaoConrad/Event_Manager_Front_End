export interface EventModel {
  id?: number;

  // 🔥 backend usa "name", mas mantemos "title" compatível
  title: string;

  description: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;

  imageUrl?: string;

  // 🔥 VEM DO BACK (ESSENCIAL PRO DASHBOARD)
  registeredParticipants?: number;

  // opcionais (mantém)
  availableSpots?: number | null;
  isSoldOut?: boolean;
  isUserRegistered?: boolean;

  // 🔥 ADICIONA ISSO PRA MAPEAR DO BACK
  name?: string;
}