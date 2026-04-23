import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth';
import { Footer } from './components/footer/footer';


  @Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink,Footer],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App {
  constructor(
    public authService: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}