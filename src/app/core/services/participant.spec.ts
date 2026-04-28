import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ParticipantService } from './participant';
import { AuthService } from './auth';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:3000/api/events';

  const authServiceMock = {
    getAuthHeaders: () => ({
      Authorization: 'Bearer fake-token'
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ParticipantService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(ParticipantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve inscrever usuário em um evento', () => {
    service.subscribe(1).subscribe((response) => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/1/participants`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush({
      message: 'Inscrição realizada com sucesso'
    });
  });

  it('deve cancelar inscrição do usuário', () => {
    service.cancelMySubscription(1).subscribe((response) => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${baseUrl}/1/participants/me`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush({
      message: 'Inscrição cancelada com sucesso'
    });
  });
});