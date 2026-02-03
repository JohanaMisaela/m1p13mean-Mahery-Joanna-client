import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-orders',
    imports: [CommonModule],
    template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 class="text-2xl font-bold mb-6">Mes Commandes</h2>
      <div class="bg-white shadow rounded-lg p-6">
        <p class="text-gray-500">Liste des commandes (à implémenter)</p>
      </div>
    </div>
  `,
    styles: []
})
export class OrdersComponent {
    private readonly authService = inject(AuthService);
    protected readonly currentUser = this.authService.currentUser;
}
