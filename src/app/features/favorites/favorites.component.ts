import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ShopService } from '../../core/services/shop.service';
import { Product, Shop } from '../../shared/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart, faStore, faShoppingBag } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, FontAwesomeModule],
  template: `
    <div class="min-h-screen bg-gray-50 pb-12">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 class="text-3xl font-light text-gray-900 mb-2">Mes Favoris</h1>
          <p class="text-gray-500">Retrouvez tous vos produits et boutiques préférés.</p>
        </div>

        <!-- Tabs -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex space-x-8">
            <button (click)="activeTab.set('products')"
                    [class]="'pb-4 border-b-2 font-medium text-sm transition-colors ' + 
                    (activeTab() === 'products' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700')">
              Produits ({{ products().length }})
            </button>
            <button (click)="activeTab.set('shops')"
                    [class]="'pb-4 border-b-2 font-medium text-sm transition-colors ' + 
                    (activeTab() === 'shops' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700')">
              Boutiques ({{ shops().length }})
            </button>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Loading State -->
        <div *ngIf="isLoading()" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>

        <!-- Products Tab -->
        <div *ngIf="!isLoading() && activeTab() === 'products'">
          <div *ngIf="products().length > 0; else noProducts" 
               class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <app-product-card *ngFor="let product of products()" [product]="product"></app-product-card>
          </div>
          <ng-template #noProducts>
            <div class="text-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <fa-icon [icon]="icons.heart" class="text-2xl"></fa-icon>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-1">Aucun produit favori</h3>
              <p class="text-gray-500 mb-6">Vous n'avez pas encore ajouté de produits à vos favoris.</p>
              <a routerLink="/" class="inline-flex items-center justify-center px-6 py-2 border border-black text-sm font-medium rounded-sm text-black bg-white hover:bg-gray-50 transition-colors uppercase tracking-wider">
                Découvrir des produits
              </a>
            </div>
          </ng-template>
        </div>

        <!-- Shops Tab -->
        <div *ngIf="!isLoading() && activeTab() === 'shops'">
          <div *ngIf="shops().length > 0; else noShops" 
               class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div *ngFor="let shop of shops()" 
                 class="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                 [routerLink]="['/shop', shop._id]">
              
              <!-- Shop Banner/Header -->
              <div class="h-24 bg-gray-100 relative group-hover:bg-gray-200 transition-colors">
                  <div class="absolute -bottom-6 left-6">
                    <div class="w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
                        <ng-container *ngIf="shop.gallery && shop.gallery.length; else noLogo">
                            <img [src]="shop.gallery[0]" class="w-full h-full object-cover">
                        </ng-container>
                        <ng-template #noLogo>
                            <div class="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                <fa-icon [icon]="icons.store"></fa-icon>
                            </div>
                        </ng-template>
                    </div>
                  </div>
              </div>

              <div class="pt-8 px-6 pb-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-900 group-hover:text-black">{{ shop.name }}</h3>
                    <span *ngIf="shop.isActive" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Actif
                    </span>
                </div>
                
                <p class="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{{ shop.slogan || 'Aucun slogan' }}</p>
                
                <div class="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4">
                    <span class="flex items-center gap-1">
                        <fa-icon [icon]="icons.store"></fa-icon>
                        Box {{ shop.mallBoxNumber || 'N/A' }}
                    </span>
                    <span class="uppercase font-medium tracking-wider group-hover:underline">Visiter</span>
                </div>
              </div>
            </div>

          </div>

          <ng-template #noShops>
            <div class="text-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <fa-icon [icon]="icons.store" class="text-2xl"></fa-icon>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-1">Aucune boutique favorite</h3>
                <p class="text-gray-500 mb-6">Vous n'avez pas encore ajouté de boutiques à vos favoris.</p>
                <a routerLink="/" class="inline-flex items-center justify-center px-6 py-2 border border-black text-sm font-medium rounded-sm text-black bg-white hover:bg-gray-50 transition-colors uppercase tracking-wider">
                  Parcourir les boutiques
                </a>
              </div>
          </ng-template>
        </div>

      </div>
    </div>
  `
})
export class FavoritesComponent implements OnInit {
  private productService = inject(ProductService);
  private shopService = inject(ShopService);

  activeTab = signal<'products' | 'shops'>('products');
  products = signal<Product[]>([]);
  shops = signal<Shop[]>([]);
  isLoading = signal<boolean>(true);

  icons = {
    heart: faHeart,
    store: faStore,
    bag: faShoppingBag
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    this.productService.getFavorites().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.products.set(data);
        this.checkLoading();
      },
      error: () => this.checkLoading()
    });

    this.shopService.getFavorites().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.shops.set(data);
        this.checkLoading();
      },
      error: () => this.checkLoading()
    });
  }


  private loadCount = 0;
  private checkLoading() {
    this.loadCount++;
    if (this.loadCount >= 2) {
      this.isLoading.set(false);
    }
  }
}
