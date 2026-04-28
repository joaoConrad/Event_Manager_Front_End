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
    token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly userStorageKey = 'eventmanager_user';
  private readonly tokenStorageKey = 'eventmanager_token';

  getUser(): AuthUser | null {
    const data = localStorage.getItem(this.userStorageKey);
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        const user = response?.data?.user;
        const token = response?.data?.token;

        if (user && token) {
          localStorage.setItem(this.userStorageKey, JSON.stringify(user));
          localStorage.setItem(this.tokenStorageKey, token);
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
        const user = response?.data?.user;
        const token = response?.data?.token;

        if (user && token) {
          localStorage.setItem(this.userStorageKey, JSON.stringify(user));
          localStorage.setItem(this.tokenStorageKey, token);
        }
      })
    );
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken() ?? ''}`
    });
  }

  logout(): void {
    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.tokenStorageKey);
  }
}