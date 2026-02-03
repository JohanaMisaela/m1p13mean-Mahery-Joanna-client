import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Functional HTTP Interceptor (Angular 21 best practice)
 * Automatically attaches JWT token to outgoing requests
 * Handles 401 unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.authToken();

    // Clone request and add authorization header if token exists
    const authReq = token
        ? req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        })
        : req;

    // Handle response and catch 401 errors
    return next(authReq).pipe(
        catchError(error => {
            if (error.status === 401) {
                // Token expired or invalid - logout user
                authService.logout();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
