import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ShopService } from '../../core/services/shop.service';
import { Product, Shop } from '../../shared/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ShopCardComponent } from '../../shared/components/shop-card/shop-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart, faStore, faShoppingBag } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, ShopCardComponent, PaginationComponent, EmptyStateComponent, FontAwesomeModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent implements OnInit {
  private productService = inject(ProductService);
  private shopService = inject(ShopService);
  private router = inject(Router);

  activeTab = signal<'products' | 'shops'>('products');
  products = signal<Product[]>([]);
  shops = signal<Shop[]>([]);
  isLoading = signal<boolean>(true);

  // Product pagination
  currentProductPage = signal<number>(1);
  totalProductPages = signal<number>(1);
  totalProducts = signal<number>(0);
  itemsPerPage = 12;

  // Shop pagination
  currentShopPage = signal<number>(1);
  totalShopPages = signal<number>(1);
  totalShops = signal<number>(0);

  icons = {
    heart: faHeart,
    store: faStore,
    bag: faShoppingBag
  };

  ngOnInit() {
    this.loadData();
  }

  switchTab(tab: 'products' | 'shops') {
    this.activeTab.set(tab);
    if (tab === 'products' && this.products().length === 0) {
      this.loadProducts();
    } else if (tab === 'shops' && this.shops().length === 0) {
      this.loadShops();
    }
  }

  loadData() {
    this.isLoading.set(true);
    this.loadProducts();
    this.loadShops();
  }

  loadProducts() {
    const params = {
      page: this.currentProductPage(),
      limit: this.itemsPerPage
    };

    this.productService.getFavorites(params).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.products.set(data);

        if (!Array.isArray(res)) {
          this.totalProductPages.set(res.totalPages || 1);
          this.totalProducts.set(res.total || 0);
        } else {
          this.totalProducts.set(data.length);
        }

        this.checkLoading();
      },
      error: () => this.checkLoading()
    });
  }

  loadShops() {
    const params = {
      page: this.currentShopPage(),
      limit: this.itemsPerPage
    };

    this.shopService.getFavorites(params).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.shops.set(data);

        if (!Array.isArray(res)) {
          this.totalShopPages.set(res.totalPages || 1);
          this.totalShops.set(res.total || 0);
        } else {
          this.totalShops.set(data.length);
        }

        this.checkLoading();
      },
      error: () => this.checkLoading()
    });
  }

  onProductPageChange(page: number) {
    this.currentProductPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onShopPageChange(page: number) {
    this.currentShopPage.set(page);
    this.loadShops();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  navigateToShops() {
    this.router.navigate(['/boutiques']);
  }

  toggleShopFavorite(shop: Shop): void {
    // Call API to toggle favorite
    this.shopService.toggleFavorite(shop._id, false).subscribe({
      next: () => {
        // Remove from local list
        this.shops.set(this.shops().filter(s => s._id !== shop._id));
        this.totalShops.update(total => Math.max(0, total - 1));
      },
      error: (err) => {
        console.error('Failed to remove favorite', err);
        alert('Erreur lors de la suppression du favori');
      }
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
