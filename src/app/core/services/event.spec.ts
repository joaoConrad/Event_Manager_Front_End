import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { EventService } from './event';
import { AuthService } from './auth';
import { EventModel } from '../../models/event.model';
import { environment } from '../../../environments/environment';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/events`;
  const apiBaseUrl = environment.apiUrl.replace(/\/api$/, '');

  const authServiceMock = {
    getToken: () => 'fake-token',
    getAuthHeaders: () => ({
      Authorization: 'Bearer fake-token'
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  it('deve buscar eventos na API', () => {
    const mockEvents: EventModel[] = [
      {
        id: 1,
        title: 'Evento Teste',
        description: 'Descrição do evento',
        startDate: '2026-05-10',
        endDate: '2026-05-10',
        date: '2026-05-10',
        startTime: '19:00',
        endTime: '21:00',
        location: 'URI',
        maxParticipants: 10,
        registeredParticipants: 2,
        availableSpots: 8,
        isSoldOut: false,
        isUserRegistered: false
      }
    ];

    service.getAll(true).subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].title).toBe('Evento Teste');
      expect(events[0].availableSpots).toBe(8);
      expect(events[0].isSoldOut).toBeFalsy();
    });

    const req = httpMock.expectOne((request) => request.url === apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('50');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush({
      page: 1,
      limit: 50,
      totalItems: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      data: mockEvents
    });
  });

  it('deve cachear eventos usando shareReplay', () => {
    service.getAll().subscribe();
    service.getAll().subscribe();

    const req = httpMock.expectOne((request) => request.url === apiUrl);
    expect(req.request.method).toBe('GET');

    req.flush({
      page: 1,
      limit: 50,
      totalItems: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
      data: []
    });
  });

  it('deve normalizar imageUrl relativo para a URL do backend', () => {
    service.getAll(true).subscribe((events) => {
      expect(events[0].imageUrl).toBe(`${apiBaseUrl}/uploads/events/capa.png`);
      expect(events[1].imageUrl).toBe(`${apiBaseUrl}/uploads/events/banner.webp`);
      expect(events[2].imageUrl).toBe('https://cdn.example.com/event.jpg');
      expect(events[3].imageUrl).toBe(`${apiBaseUrl}/uploads/events/backend-bug.png`);
    });

    const req = httpMock.expectOne((request) => request.url === apiUrl);

    req.flush({
      page: 1,
      limit: 50,
      totalItems: 4,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      data: [
        {
          id: 1,
          title: 'Evento com imagem relativa',
          description: 'Teste',
          startDate: '2026-05-10',
          endDate: '2026-05-10',
          startTime: '19:00',
          endTime: '21:00',
          location: 'URI',
          maxParticipants: 10,
          imageUrl: '/uploads/events/capa.png'
        },
        {
          id: 2,
          title: 'Evento com imagePath',
          description: 'Teste',
          startDate: '2026-05-11',
          endDate: '2026-05-11',
          startTime: '19:00',
          endTime: '21:00',
          location: 'URI',
          maxParticipants: 10,
          imagePath: 'C:\\app\\uploads\\events\\banner.webp'
        },
        {
          id: 3,
          title: 'Evento com CDN',
          description: 'Teste',
          startDate: '2026-05-12',
          endDate: '2026-05-12',
          startTime: '19:00',
          endTime: '21:00',
          location: 'URI',
          maxParticipants: 10,
          imageUrl: 'https://cdn.example.com/event.jpg'
        },
        {
          id: 4,
          title: 'Evento com caminho fisico em URL absoluta',
          description: 'Teste',
          startDate: '2026-05-13',
          endDate: '2026-05-13',
          startTime: '19:00',
          endTime: '21:00',
          location: 'URI',
          maxParticipants: 10,
          imageUrl: `${apiBaseUrl}/C:/Users/Usuario/app/uploads/events/backend-bug.png`
        }
      ]
    });
  });

  it('deve normalizar imageUrl em resposta envelopada do getById', () => {
    service.getById(1).subscribe((event) => {
      expect(event.imageUrl).toBe(`${apiBaseUrl}/uploads/events/detail.jpg`);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');

    req.flush({
      data: {
        id: 1,
        title: 'Evento detalhe',
        description: 'Teste',
        startDate: '2026-05-10',
        endDate: '2026-05-10',
        startTime: '19:00',
        endTime: '21:00',
        location: 'URI',
        maxParticipants: 10,
        imageUrl: '/uploads/events/detail.jpg'
      }
    });
  });

  it('deve criar evento e limpar cache', () => {
    const newEvent: EventModel = {
      title: 'Novo Evento',
      description: 'Teste',
      startDate: '2026-05-12',
      endDate: '2026-05-12',
      date: '2026-05-12',
      startTime: '20:00',
      endTime: '22:00',
      location: 'Auditório',
      maxParticipants: 30
    };

    service.create(newEvent).subscribe((event) => {
      expect(event.title).toBe('Novo Evento');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Novo Evento');

    req.flush({
      ...newEvent,
      id: 1,
      registeredParticipants: 0,
      availableSpots: 30,
      isSoldOut: false,
      isUserRegistered: false
    });
  });

  it('deve excluir evento', () => {
    service.delete(1).subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');

    req.flush({});
  });
});
