import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  SignupRequest,
} from '../../shared/models/api-response.model';

const TOKEN_KEY = 'bonicare_token';
const USER_KEY = 'bonicare_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _user = signal<AuthUser | null>(this.loadUser());
  private readonly _token = signal<string | null>(this.loadToken());

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly role = computed(() => this._user()?.role ?? null);

  login(credentials: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => this.setSession(res.token, res.user)),
      catchError((err) => throwError(() => err))
    );
  }

  signup(data: SignupRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, data).pipe(
      tap((res) => this.setSession(res.token, res.user)),
      catchError((err) => throwError(() => err))
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  updateUser(user: AuthUser): void {
    this._user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  hasRole(...roles: AuthUser['role'][]): boolean {
    const userRole = this._user()?.role;
    return !!userRole && roles.includes(userRole);
  }

  getDashboardRoute(): string {
    const role = this._user()?.role;
    switch (role) {
      case 'doctor':
        return '/doctor';
      case 'admin':
        return '/admin';
      default:
        return '/patient';
    }
  }

  private setSession(token: string, user: AuthUser): void {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private loadToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
