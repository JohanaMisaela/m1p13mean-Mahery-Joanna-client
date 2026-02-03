import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div class="mb-4">
          <svg class="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
        <p class="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div class="space-y-3">
          <p class="text-sm text-gray-500">
            Votre rôle : <span class="font-semibold">{{ currentUser()?.role || 'Non connecté' }}</span>
          </p>
          <div class="flex gap-3 justify-center">
            <a
              routerLink="/"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors inline-block text-center no-underline cursor-pointer"
            >
              Retour
            </a>
            
            @if (!currentUser()) {
                <a
                  routerLink="/auth/login"
                  class="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors inline-block text-center no-underline cursor-pointer"
                >
                  Connexion
                </a>
            } @else {
                <button
                  (click)="logout()"
                  class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Se déconnecter
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class UnauthorizedComponent {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;

  protected logout(): void {
    this.authService.logout();
  }
}
