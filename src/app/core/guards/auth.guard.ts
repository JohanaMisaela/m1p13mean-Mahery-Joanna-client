import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional Route Guard (Angular 21 best practice)
 * Protects routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
    }

    // Redirect to login with return URL
    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });
    return false;
};

/**
 * Guest Guard - prevents authenticated users from accessing auth pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        return true;
    }

    // Redirect to home if already logged in
    router.navigate(['/']);
    return false;
};
