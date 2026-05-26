import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve realizar login e salvar token e usuário', () => {
    service.login('admin@admin.com', 'adminpassword').subscribe((response) => {
      expect(response.data?.accessToken).toBe('fake-token');
      expect(response.data?.refreshToken).toBe('fake-refresh-token');
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('admin@admin.com');

    req.flush({
      message: 'Login realizado com sucesso',
      data: {
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh-token',
        user: {
          id: 1,
          name: 'Admin',
          email: 'admin@admin.com',
          role: 'admin'
        }
      }
    });

    expect(localStorage.getItem('eventmanager_token')).toBe('fake-token');
    expect(localStorage.getItem('eventmanager_refresh_token')).toBe('fake-refresh-token');
    expect(localStorage.getItem('eventmanager_user')).toContain('admin@admin.com');
  });

  it('deve identificar admin corretamente', () => {
    localStorage.setItem('eventmanager_user', JSON.stringify({
      id: 1,
      name: 'Admin',
      email: 'admin@admin.com',
      role: 'admin'
    }));

    expect(service.isAdmin()).toBeTruthy();
  });

  it('deve retornar false para usuário comum', () => {
    localStorage.setItem('eventmanager_user', JSON.stringify({
      id: 2,
      name: 'User',
      email: 'user@email.com',
      role: 'user'
    }));

    expect(service.isAdmin()).toBeFalsy();
  });

  it('deve limpar sessão no logout', () => {
    localStorage.setItem('eventmanager_token', 'fake-token');
    localStorage.setItem('eventmanager_user', JSON.stringify({ role: 'admin' }));

    service.logout();

    expect(localStorage.getItem('eventmanager_token')).toBeNull();
    expect(localStorage.getItem('eventmanager_user')).toBeNull();
  });

  it('deve retornar headers com token', () => {
    localStorage.setItem('eventmanager_token', 'fake-token');

    const headers = service.getAuthHeaders();

    expect(headers.get('Authorization')).toBe('Bearer fake-token');
  });
});
