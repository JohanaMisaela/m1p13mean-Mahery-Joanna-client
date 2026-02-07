import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/user.model';

import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly API_URL = environment.apiUrl;
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'current_user';

    // Signals for reactive state management
    private readonly _currentUser = signal<User | null>(this.getUserFromStorage());
    private readonly _authToken = signal<string | null>(this.getTokenFromStorage());

    // Public computed signals
    readonly currentUser = this._currentUser.asReadonly();
    readonly authToken = this._authToken.asReadonly();
    readonly isLoggedIn = computed(() => !!this._authToken());

    /**
     * Login user with email and password
     */
    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
            tap(response => this.handleAuthSuccess(response)),
            catchError(error => {
                console.error('Login error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Register new user
     */
    register(userData: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
            tap(response => this.handleAuthSuccess(response)),
            catchError(error => {
                console.error('Registration error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Logout user
     */
    logout(): void {
        // Clear local storage
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        // Reset signals
        this._currentUser.set(null);
        this._authToken.set(null);

        // Navigate to login
        this.router.navigate(['/auth/login']);
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(response: AuthResponse): void {
        // Store token and user in localStorage
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

        // Update signals
        this._authToken.set(response.token);
        this._currentUser.set(response.user);
    }

    /**
     * Manually update current user state
     */
    updateCurrentUser(user: User): void {
        this._currentUser.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Get token from localStorage
     */
    private getTokenFromStorage(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(this.TOKEN_KEY);
        }
        return null;
    }

    /**
     * Get user from localStorage
     */
    private getUserFromStorage(): User | null {
        if (typeof window !== 'undefined') {
            const userJson = localStorage.getItem(this.USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        }
        return null;
    }
}
