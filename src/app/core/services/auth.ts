import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  message?: string;
  data?: {
    user: AuthUser;
    accessToken: string;   // era 'token', agora é 'accessToken'
    refreshToken: string;  // novo campo do back
  };
}

interface RefreshResponse {
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly userStorageKey         = 'eventmanager_user';
  private readonly accessTokenStorageKey  = 'eventmanager_token';        // chave mantida pra não quebrar código existente
  private readonly refreshTokenStorageKey = 'eventmanager_refresh_token';

  // ── Leitura ────────────────────────────────────────────

  getUser(): AuthUser | null {
    const data = localStorage.getItem(this.userStorageKey);
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessTokenStorageKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenStorageKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  // ── Salvar tokens (usado pelo interceptor também) ──────

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.accessTokenStorageKey, accessToken);
    localStorage.setItem(this.refreshTokenStorageKey, refreshToken);
  }

  // ── Auth ───────────────────────────────────────────────

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        const user         = response?.data?.user;
        const accessToken  = response?.data?.accessToken;
        const refreshToken = response?.data?.refreshToken;

        if (user && accessToken && refreshToken) {
          localStorage.setItem(this.userStorageKey, JSON.stringify(user));
          this.saveTokens(accessToken, refreshToken);
        }
      })
    );
  }

  register(name: string, email: string, password: string, phone?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      phone,
      password
    }).pipe(
      tap((response) => {
        const user         = response?.data?.user;
        const accessToken  = response?.data?.accessToken;
        const refreshToken = response?.data?.refreshToken;

        if (user && accessToken && refreshToken) {
          localStorage.setItem(this.userStorageKey, JSON.stringify(user));
          this.saveTokens(accessToken, refreshToken);
        }
      })
    );
  }

  // ── Refresh token ──────────────────────────────────────
  // Chamado automaticamente pelo AuthInterceptor quando recebe TOKEN_EXPIRED

  refreshAccessToken(): Observable<RefreshResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        const accessToken  = response?.data?.accessToken;
        const newRefresh   = response?.data?.refreshToken;
        if (accessToken && newRefresh) {
          this.saveTokens(accessToken, newRefresh);
        }
      })
    );
  }

  // ── Logout ─────────────────────────────────────────────

  logout(): void {
    const refreshToken = this.getRefreshToken();

    // avisa o back pra invalidar o refresh token no banco
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
        error: () => {} // silencia erro — o logout local acontece de qualquer forma
      });
    }

    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.accessTokenStorageKey);
    localStorage.removeItem(this.refreshTokenStorageKey);
  }

  // ── Headers ────────────────────────────────────────────

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken() ?? ''}`
    });
  }
}