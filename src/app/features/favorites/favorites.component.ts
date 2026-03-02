import { Component, OnInit, inject, signal, afterNextRender } from '@angular/core';
import { switchMap, map, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ShopService } from '../../core/services/shop.service';
import { ProductVariantService } from '../../core/services/product-variant.service';
import { PromotionService } from '../../core/services/promotion.service';
import { ToastService } from '../../core/services/toast.service';
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
  imports: [
    CommonModule,
    ProductCardComponent,
    ShopCardComponent,
    PaginationComponent,
    EmptyStateComponent,
    FontAwesomeModule,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class FavoritesComponent implements OnInit {
  private productService = inject(ProductService);
  private shopService = inject(ShopService);
  private productVariantService = inject(ProductVariantService);
  private promotionService = inject(PromotionService);
  private toastService = inject(ToastService);
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
    bag: faShoppingBag,
  };

  constructor() {
    afterNextRender(() => {
      this.loadData();
    });
  }

  ngOnInit() {}

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
      limit: this.itemsPerPage,
    };

    this.productService.getFavorites(params).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        console.log('Favorites raw response:', res);
        console.log('Favorites data list:', data);

        // Hydrate products with full details to get variants and promotions (since backend favorites endpoint is lightweight)
        const hydratedProducts: Product[] = [];
        let completed = 0;

        if (data.length === 0) {
          console.log('No favorites found.');
          this.products.set([]);
          this.totalProducts.set(0);
          this.checkLoading();
          return;
        }

        console.log('Starting hydration for', data.length, 'products');

        data.forEach((p: Product) => {
          console.log('Fetching full details for product:', p._id);

          this.productService
            .getProduct(p._id)
            .pipe(
              switchMap((fullProduct) => {
                const shopId =
                  typeof fullProduct.shop === 'string' ? fullProduct.shop : fullProduct.shop._id;
                return forkJoin({
                  product: of(fullProduct),
                  variants: this.productVariantService
                    .getVariantsByProduct(fullProduct._id)
                    .pipe(catchError(() => of([]))),
                  promotions: this.promotionService
                    .getShopPromotions(shopId)
                    .pipe(catchError(() => of([]))),
                });
              }),
            )
            .subscribe({
              next: ({ product, variants, promotions }) => {
                // Enrich product with variants and promotions logic (mirrors backend getAllProducts)
                const relevantIds = [product._id, ...variants.map((v: any) => v._id)];
                const now = new Date();

                const activePromos = (
                  Array.isArray(promotions) ? promotions : promotions.data || []
                )
                  .filter((promo: any) => {
                    const start = new Date(promo.startDate);
                    const end = new Date(promo.endDate);
                    return (
                      promo.isActive &&
                      now >= start &&
                      now <= end &&
                      promo.products?.some((id: string) => relevantIds.includes(id))
                    );
                  })
                  .sort((a: any, b: any) => {
                    if (b.discountPercentage !== a.discountPercentage) {
                      return b.discountPercentage - a.discountPercentage;
                    }
                    return a.name.localeCompare(b.name);
                  });

                const bestPromo = activePromos.length > 0 ? activePromos[0] : null;
                const firstVariant = variants[0];

                const enrichedProduct: Product = {
                  ...product,
                  variants: variants, // properties might differ lightly but okay for card
                  price: product.price || firstVariant?.price || 0,
                  stock:
                    product.stock ||
                    variants.reduce((acc: number, v: any) => acc + v.stock, 0) ||
                    0,
                  images:
                    product.images && product.images.length > 0
                      ? product.images
                      : firstVariant?.images || [],
                  activePromotion: bestPromo
                    ? {
                        name: bestPromo.name,
                        discountPercentage: bestPromo.discountPercentage,
                        endDate: bestPromo.endDate,
                      }
                    : undefined,
                  isOnSale: !!bestPromo,
                };

                hydratedProducts.push(enrichedProduct);
                completed++;
                if (completed === data.length) {
                  const ordered = data.map((orig: Product) =>
                    hydratedProducts.find((hp) => hp._id === orig._id),
                  );
                  const finalProducts = ordered.filter(
                    (x: Product | undefined): x is Product => !!x,
                  );
                  console.log('Hydration complete. Final products:', finalProducts);
                  this.products.set(finalProducts);
                  this.checkLoading();
                }
              },
              error: (err) => {
                console.error('Error hydrating product', p._id, err);
                completed++;
                if (completed === data.length) {
                  this.products.set(hydratedProducts);
                  this.checkLoading();
                }
              },
            });
        });

        if (!Array.isArray(res)) {
          this.totalProductPages.set(res.totalPages || 1);
          this.totalProducts.set(res.total || 0);
        } else {
          this.totalProducts.set(data.length);
        }
      },
      error: () => this.checkLoading(),
    });
  }

  loadShops() {
    const params = {
      page: this.currentShopPage(),
      limit: this.itemsPerPage,
    };

    this.shopService.getFavorites(params).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        this.shops.set(data);

        if (!Array.isArray(res)) {
          this.totalShopPages.set(res.totalPages || 1);
          this.totalShops.set(res.total || 0);
        } else {
          this.totalShops.set(data.length);
        }

        this.checkLoading();
      },
      error: () => this.checkLoading(),
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
        this.shops.set(this.shops().filter((s) => s._id !== shop._id));
        this.totalShops.update((total) => Math.max(0, total - 1));
      },
      error: (err) => {
        console.error('Failed to remove favorite', err);
        this.toastService.error('Erreur lors de la suppression du favori');
      },
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
