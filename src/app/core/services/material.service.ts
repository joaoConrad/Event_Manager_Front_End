import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MaterialModel } from '../../models/material.model';

// ─────────────────────────────────────────────────────────────────────────────
// DADOS MOCK — substitua pelas chamadas reais à API quando o back estiver pronto
// Exemplo de troca futura:
//   return this.http.get<MaterialModel[]>(`${this.apiUrl}/materials/me`);
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_MATERIALS: MaterialModel[] = [
  {
    id: 1,
    title: 'Slides da Palestra Principal',
    description: 'Apresentação completa com todos os tópicos abordados na abertura do evento.',
    type: 'pdf',
    url: 'https://example.com/materiais/slides-abertura.pdf',
    eventId: 1,
    eventTitle: 'Summit de Tecnologia 2025',
    eventDate: '2025-09-14',
    releasedAt: '2025-09-14T10:00:00',
    sizeLabel: '4,2 MB',
  },
  {
    id: 2,
    title: 'Gravação — Painel de IA',
    description: 'Vídeo completo do painel sobre inteligência artificial com Q&A.',
    type: 'video',
    url: 'https://example.com/materiais/painel-ia.mp4',
    eventId: 1,
    eventTitle: 'Summit de Tecnologia 2025',
    eventDate: '2025-09-14',
    releasedAt: '2025-09-16T08:00:00',
    sizeLabel: '1,1 GB',
  },
  {
    id: 3,
    title: 'Repositório de Exemplos',
    description: 'Código-fonte dos exemplos demonstrados durante os workshops.',
    type: 'link',
    url: 'https://github.com/example/summit-2025-code',
    eventId: 1,
    eventTitle: 'Summit de Tecnologia 2025',
    eventDate: '2025-09-14',
    releasedAt: '2025-09-14T14:00:00',
  },
  {
    id: 4,
    title: 'Apostila — Workshop de Cloud',
    description: 'Material didático completo do workshop prático de infraestrutura em nuvem.',
    type: 'pdf',
    url: 'https://example.com/materiais/apostila-cloud.pdf',
    eventId: 2,
    eventTitle: 'Workshop DevOps & Cloud',
    eventDate: '2025-10-05',
    releasedAt: '2025-10-06T09:00:00',
    sizeLabel: '8,7 MB',
  },
  {
    id: 5,
    title: 'Fotos do Evento',
    description: 'Galeria com os melhores momentos registrados durante o dia.',
    type: 'zip',
    url: 'https://example.com/materiais/fotos-summit.zip',
    eventId: 1,
    eventTitle: 'Summit de Tecnologia 2025',
    eventDate: '2025-09-14',
    releasedAt: '2025-09-17T18:00:00',
    sizeLabel: '312 MB',
  },
  {
    id: 6,
    title: 'Certificado de Participação',
    description: 'Seu certificado personalizado de participação no evento.',
    type: 'pdf',
    url: 'https://example.com/certificados/summit-2025-joao.pdf',
    eventId: 1,
    eventTitle: 'Summit de Tecnologia 2025',
    eventDate: '2025-09-14',
    releasedAt: '2025-09-20T10:00:00',
    sizeLabel: '180 KB',
  },
];

@Injectable({
  providedIn: 'root',
})
export class MaterialService {
  // TODO: quando o back estiver pronto, injete HttpClient e troque os métodos abaixo
  // private readonly http = inject(HttpClient);
  // private readonly apiUrl = `${environment.apiUrl}`;

  /** Retorna todos os materiais do participante logado */
  getMaterials(): Observable<MaterialModel[]> {
    return of(MOCK_MATERIALS).pipe(delay(600));
  }

  /** Retorna materiais de um evento específico */
  getMaterialsByEvent(eventId: number): Observable<MaterialModel[]> {
    return of(MOCK_MATERIALS.filter((m) => m.eventId === eventId)).pipe(delay(400));
  }
}
