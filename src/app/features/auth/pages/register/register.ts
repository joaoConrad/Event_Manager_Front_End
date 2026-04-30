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

    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Preencha nome, email e senha.';
      return;
    }

    if (this.name.trim().length < 2) {
      this.errorMessage = 'O nome deve ter pelo menos 2 caracteres.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Informe um email válido.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    if (this.password.length > 128) {
      this.errorMessage = 'A senha pode ter no máximo 128 caracteres.';
      return;
    }

    this.loading = true;

    this.authService.register(this.name.trim(), this.email.trim(), this.password, this.phone || undefined).subscribe({
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