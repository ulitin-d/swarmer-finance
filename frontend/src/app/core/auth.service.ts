import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken = signal<string | null>(localStorage.getItem('accessToken'));
  private userSignal = signal<User | null>(null);

  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly user = computed(() => this.userSignal());

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken.set(token);
      this.loadUser();
    }
  }

  private loadUser() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.userSignal.set(JSON.parse(storedUser));
    }
  }

  register(email: string, password: string) {
    return this.http.post<ApiResponse<AuthResponse>>('/api/auth/register', { email, password })
      .pipe(tap(response => this.handleAuth(response.data)));
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password })
      .pipe(tap(response => this.handleAuth(response.data)));
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.accessToken.set(null);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.accessToken();
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.logout();
      return;
    }

    this.http.post<ApiResponse<AuthResponse>>('/api/auth/refresh', { refreshToken })
      .pipe(tap(response => this.handleAuth(response.data)))
      .subscribe({
        error: () => this.logout()
      });
  }

  private handleAuth(data: AuthResponse | null) {
    if (!data) return;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.accessToken.set(data.accessToken);
    this.userSignal.set(data.user);
  }
}
