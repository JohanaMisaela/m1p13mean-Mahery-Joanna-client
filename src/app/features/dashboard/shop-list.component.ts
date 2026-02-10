import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../shared/models/product.model';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800 uppercase tracking-wider">Liste des Boutiques</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
            <tr>
              <th class="px-6 py-3 text-left tracking-wider">Nom</th>
              <th class="px-6 py-3 text-left tracking-wider">Propriétaire</th>
              <th class="px-6 py-3 text-left tracking-wider">Statut</th>
              <th class="px-6 py-3 text-right tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200 text-sm">
            <tr *ngFor="let shop of shops()" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <img *ngIf="shop.gallery?.length" [src]="shop.gallery[0]" class="h-10 w-10 rounded-full object-cover">
                    <span *ngIf="!shop.gallery?.length" class="text-xs">SHOP</span>
                  </div>
                  <div class="ml-4">
                    <div class="font-medium text-gray-900">{{ shop.name }}</div>
                    <div class="text-gray-500 text-xs">{{ shop.mallBoxNumber }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-600">
                {{ shop.owner?.name || 'Inconnu' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="'px-2 py-1 text-xs font-semibold rounded-full ' + (shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')">
                  {{ shop.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <button (click)="manageShop(shop._id)" 
                        class="text-gray-900 hover:text-black font-medium border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 transition-all">
                  Gérer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class ShopListComponent implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  shops = signal<Shop[]>([]);

  ngOnInit() {
    this.shopService.getShops().subscribe(res => {
      this.shops.set(res.data);
    });
  }

  manageShop(shopId: string) {
    this.router.navigate(['/admin/shop', shopId]);
  }
}
