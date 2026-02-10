import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';

import { ShopListComponent } from './shop-list.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ShopListComponent],
  template: `
    <div class="flex flex-col font-sans text-gray-900 h-full">
      <!-- Main Content -->
      <main class="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div class="bg-white border border-gray-200 shadow-sm p-8 w-full">
          
          <div class="mb-12 border-b border-gray-100 pb-8">
            <h2 class="text-4xl font-light text-gray-900 mb-2">Tableau de Bord</h2>
            <p class="text-gray-400 uppercase tracking-widest text-xs">{{ currentUser()?.role }} • {{ currentUser()?.email }}</p>
          </div>

          <div class="space-y-8">
            @if (currentUser()?.role === 'admin') {
                <app-shop-list></app-shop-list>
            } @else if (currentUser()?.role === 'shop') {
                <div class="flex flex-col items-center py-20 bg-gray-50 border border-dashed border-gray-200">
                    <button (click)="manageMyShop()" 
                            class="bg-black text-white px-10 py-4 uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-xl active:scale-95">
                        Gérer Ma Boutique
                    </button>
                </div>
            }
          </div>

        </div>
      </main>
    </div>
  `,
  styles: ``
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  manageMyShop() {
    this.shopService.getShops().subscribe(res => {
      // Find shop where owner is current user
      const myShop = res.data.find((s: any) => s.owner?._id === this.currentUser()?._id);
      if (myShop) {
        this.router.navigate(['/admin/shop', myShop._id]);
      }
    });
  }
}
