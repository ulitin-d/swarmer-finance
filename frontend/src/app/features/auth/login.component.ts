import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TuiButton],
  template: `
    <div class="auth-container">
      <div class="auth-card card">
        <h1>Login</h1>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" formControlName="email" class="form-input" placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" formControlName="password" class="form-input" placeholder="Enter your password">
          </div>
          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }
          <button tuiButton size="l" type="submit" [disabled]="loading()">
            {{ loading() ? 'Loading...' : 'Login' }}
          </button>
        </form>
        <p class="auth-link">
          Don't have an account? <a routerLink="/register">Register</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 32px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    h1 { margin: 0 0 24px; font-size: 24px; font-weight: 600; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #666; }
    .form-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: #526ed3; }
    button[type="submit"] { width: 100%; margin-top: 8px; }
    .error-message { color: #d32f2f; margin-bottom: 16px; font-size: 14px; }
    .auth-link { text-align: center; margin-top: 16px; color: #666; }
    .auth-link a { color: #526ed3; text-decoration: none; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  loading = signal(false);
  error = signal('');

  onSubmit() {
    if (this.form.invalid) return;
    
    this.loading.set(true);
    this.error.set('');

    this.authService.login(
      this.form.value.email!,
      this.form.value.password!
    ).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Login failed');
      }
    });
  }
}
