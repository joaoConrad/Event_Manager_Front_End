import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = '';
  email = '';
  phone = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.errorMessage = '';

    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Preencha nome, email e senha.';
      return;
    }

    this.loading = true;

    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Não foi possível realizar o cadastro.';
      }
    });
  }
}