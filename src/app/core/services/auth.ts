import { Injectable } from '@angular/core';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: AuthUser | null = {
    name: 'Bruno',
    email: 'bruno@email.com',
    role: 'admin'
  };

  getUser(): AuthUser | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  loginAsAdmin(): void {
    this.currentUser = {
      name: 'Administrador',
      email: 'admin@email.com',
      role: 'admin'
    };
  }

  loginAsUser(): void {
    this.currentUser = {
      name: 'Usuário Comum',
      email: 'user@email.com',
      role: 'user'
    };
  }

  logout(): void {
    this.currentUser = null;
  }
}