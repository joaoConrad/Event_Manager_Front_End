import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(
    public authService: AuthService,
    private readonly router: Router
  ) {}

  getInitials(): string {
    const name = this.authService.getUser()?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}