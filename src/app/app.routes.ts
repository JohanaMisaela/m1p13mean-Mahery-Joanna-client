import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'shop/:id',
                loadComponent: () => import('./features/shops/shop-detail/shop-detail.component').then(m => m.PublicShopDetailComponent)
            },
            {
                path: 'product/:id',
                loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
            },
            {
                path: 'dashboard',
                canActivate: [roleGuard],
                data: { roles: ['admin', 'shop'] },
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'profil',
                canActivate: [roleGuard],
                data: { roles: ['admin', 'shop', 'user'] },
                loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent)
            },
            {
                path: 'unauthorized',
                loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
            },
            {
                path: 'favorites',
                canActivate: [roleGuard],
                data: { roles: ['user', 'shop', 'admin'] },
                loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
            },
            {
                path: 'orders',
                canActivate: [roleGuard],
                data: { roles: ['user', 'shop', 'admin'] },
                loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent)
            },
            {
                path: 'shop',
                canActivate: [roleGuard],
                data: { roles: ['shop', 'admin'] },
                loadComponent: () => import('./features/shop/shop-dashboard/shop-dashboard.component').then(m => m.ShopDashboardComponent)
            },
            {
                path: 'admin/shop/:id',
                canActivate: [roleGuard],
                data: { roles: ['admin', 'shop'] },
                loadComponent: () => import('./features/shop/shop-management/shop-management.component').then(m => m.ShopManagementComponent)
            },
            {
                path: 'shops',
                loadComponent: () => import('./features/shops/shop-list.component').then(m => m.PublicShopListComponent)
            },
            {
                path: 'cart',
                canActivate: [roleGuard],
                data: { roles: ['user', 'shop', 'admin'] },
                loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
            },
        ]
    },

    {
        path: 'auth',
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'signup',
                loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
            }
        ]
    },


    // Wildcard
    {
        path: '**',
        redirectTo: '/'
    }
];
