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

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
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

    const req = httpMock.expectOne(apiUrl);
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
