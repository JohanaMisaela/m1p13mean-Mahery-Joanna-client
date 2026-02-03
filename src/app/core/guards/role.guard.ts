import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-based guard - restricts access based on user role
 * Usage: canActivate: [roleGuard], data: { roles: ['admin', 'shop'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if user is logged in
    if (!authService.isLoggedIn()) {
        router.navigate(['/auth/login']);
        return false;
    }

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[];
    const currentUser = authService.currentUser();

    // If no roles specified, just check authentication
    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }

    // Check if user has one of the required roles
    console.log('RoleGuard Debug:', {
        currentUserRole: currentUser?.role,
        requiredRoles: requiredRoles,
        hasRole: currentUser && requiredRoles.includes(currentUser.role)
    });

    if (currentUser && requiredRoles.includes(currentUser.role)) {
        return true;
    }

    // User doesn't have required role - redirect to unauthorized page
    router.navigate(['/unauthorized']);
    return false;
};
