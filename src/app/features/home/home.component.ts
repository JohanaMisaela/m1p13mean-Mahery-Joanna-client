import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterLink],
    template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">E-Commerce</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">{{ currentUser()?.name }}</span>
            <button
              (click)="logout()"
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Bienvenue, {{ currentUser()?.name }}!</h2>
          <div class="space-y-2 text-gray-600">
            <p><strong>Email:</strong> {{ currentUser()?.email }}</p>
            <p><strong>Rôle:</strong> <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">{{ currentUser()?.role }}</span></p>
          </div>
        </div>

        <!-- Navigation Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Admin Dashboard -->
          @if (currentUser()?.role === 'admin') {
            <a routerLink="/dashboard" class="block p-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white">
              <h3 class="text-lg font-semibold mb-2">Dashboard Admin</h3>
              <p class="text-white/80">Gérer les utilisateurs et les paramètres</p>
            </a>
          }

          <!-- Products -->
          <div class="block p-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white cursor-pointer">
            <h3 class="text-lg font-semibold mb-2">Produits</h3>
            <p class="text-white/80">Parcourir les produits disponibles</p>
          </div>

          <!-- Orders -->
          <div class="block p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white cursor-pointer">
            <h3 class="text-lg font-semibold mb-2">Commandes</h3>
            <p class="text-white/80">Voir vos commandes</p>
          </div>

          <!-- Shop (for shop owners) -->
          @if (currentUser()?.role === 'shop') {
            <div class="block p-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-white cursor-pointer">
              <h3 class="text-lg font-semibold mb-2">Ma Boutique</h3>
              <p class="text-white/80">Gérer votre boutique</p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
    styles: ``
})
export class HomeComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly currentUser = this.authService.currentUser;

    protected logout(): void {
        this.authService.logout();
    }
}
