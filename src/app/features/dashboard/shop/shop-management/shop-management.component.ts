import { Component, OnInit, OnDestroy, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ShopService } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductService } from '../../../../core/services/product.service';
import { ProductVariantService } from '../../../../core/services/product-variant.service';
import { PromotionService } from '../../../../core/services/promotion.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Shop, Product, Category } from '../../../../shared/models/product.model';
import { ShopHeaderComponent } from '../components/shop-header/shop-header.component';
import { ShopSettingsFormComponent } from '../components/shop-settings-form/shop-settings-form.component';
import { FooterComponent } from '../../../../core/layout/footer/footer.component';

import { ProductManagementComponent } from '../components/product-management/product-management.component';
import { PromotionManagementComponent } from '../components/promotion-management/promotion-management.component';
import { ReportManagementComponent } from '../components/report-management/report-management.component';
import { OrderListComponent } from '../components/order-list/order-list.component';
import { ChatManagementComponent } from '../components/chat-management/chat-management.component';
import { ChatService } from '../../../../core/services/chat.service';
import { ReportService } from '../../../../core/services/report.service';

@Component({
  selector: 'app-shop-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ShopHeaderComponent,
    ShopSettingsFormComponent,
    ProductManagementComponent,
    PromotionManagementComponent,
    ReportManagementComponent,
    OrderListComponent,
    ChatManagementComponent,
    FooterComponent,
  ],
  templateUrl: './shop-management.component.html',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
      }
    `,
  ],
})
export class ShopManagementComponent implements OnInit, OnDestroy {
  private readonly shopService = inject(ShopService);
  private readonly productService = inject(ProductService);
  private readonly variantService = inject(ProductVariantService);
  private readonly promotionService = inject(PromotionService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly chatService = inject(ChatService);
  private readonly reportService = inject(ReportService);

  protected userRating = signal<number>(0);

  currentUser = this.authService.currentUser;
  activeView = signal<
    'preview' | 'settings' | 'products' | 'promotions' | 'orders' | 'reports' | 'chat'
  >('products');

  shop = signal<Shop | null>(null);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  promotions = signal<any[]>([]);
  productTotal = signal(0);
  productPage = signal(1);
  productLimit = signal(50);

  isAddingProduct = signal(false);
  isSavingProduct = signal(false);

  chatUnreadCount = signal(0);
  reportPendingCount = signal(0);

  showProductForm = signal(false);
  showVariantForm = signal(false);
  showPromotionForm = signal(false);

  selectedProduct: any = null;
  currentProductId: string = '';
  private indicatorInterval: any;

  constructor() {
    afterNextRender(() => {
      const shopId = this.route.snapshot.paramMap.get('id');
      if (shopId) {
        this.loadShop(shopId);
        this.loadProducts(shopId);
        this.loadCategories();
        this.loadPromotions(shopId);
        if (this.currentUser()) {
          this.loadUserRating(shopId);
        }
      }
    });
  }

  ngOnInit() {
    this.startIndicatorPolling();
  }

  ngOnDestroy() {
    if (this.indicatorInterval) {
      clearInterval(this.indicatorInterval);
    }
  }

  private startIndicatorPolling() {
    this.indicatorInterval = setInterval(() => {
      const id = this.shop()?._id;
      if (id) {
        this.loadIndicators(id);
      }
    }, 10000); // Polling every 10 seconds
  }

  loadShop(id: string) {
    this.shopService.getShopById(id).subscribe((s) => {
      this.shop.set(s);
      this.loadIndicators(id);
    });
  }

  loadIndicators(id: string) {
    this.chatService
      .getShopUnreadCount(id)
      .subscribe((res) => this.chatUnreadCount.set(res.totalUnread));
    if (this.currentUser()?.role === 'admin') {
      this.reportService
        .getPendingCount(id)
        .subscribe((res) => this.reportPendingCount.set(res.count));
    }
  }

  loadCategories() {
    console.log('ShopManagement: Loading categories...');
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        console.log('ShopManagement: Categories parsed:', data);
        this.categories.set(data);
      },
      error: (err) => console.error('ShopManagement: Error loading categories:', err),
    });
  }

  loadUserRating(shopId: string) {
    this.shopService.getMyShopRating(shopId).subscribe({
      next: (res) => this.userRating.set(res?.rating || 0),
      error: () => this.userRating.set(0),
    });
  }

  loadProducts(shopId: string) {
    this.productService
      .getProducts({
        shop: shopId,
        isActive: 'all',
        page: this.productPage(),
        limit: this.productLimit(),
      })
      .subscribe((res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        console.log(data);

        this.products.set(data);
        this.productTotal.set(res.total || data.length);
      });
  }

  loadPromotions(shopId: string) {
    this.promotionService.getShopPromotions(shopId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        // Filter only active promotions
        const activePromotions = data.filter((p: any) => {
          const now = new Date();
          const start = new Date(p.startDate);
          const end = new Date(p.endDate);
          return p.isActive && now >= start && now <= end;
        });
        this.promotions.set(activePromotions);
      },
      error: () => this.promotions.set([]),
    });
  }

  onProductPageChange(page: number) {
    this.productPage.set(page);
    this.loadProducts(this.shop()?._id!);
  }

  onRefresh() {
    const shopId = this.shop()?._id;
    if (shopId) {
      this.loadProducts(shopId);
      this.loadCategories();
    }
  }

  handleCreateCategory(name: string) {
    if (!name.trim()) return;

    this.isSavingProduct.set(true);
    this.categoryService.createCategory({ name, type: 'product' }).subscribe({
      next: (newCategory) => {
        this.isSavingProduct.set(false);
        this.toastService.success(`Catégorie "${newCategory.name}" créée !`);
        this.loadCategories();
      },
      error: (err) => {
        this.isSavingProduct.set(false);
        this.toastService.error('Erreur lors de la création de la catégorie.');
        console.error('Error creating category:', err);
      },
    });
  }

  openProductForm(product?: any) {
    if (product) {
      // Edit mode - handled by inline edit in child usually or modal
      this.selectedProduct = product;
      this.showProductForm.set(true); // Keep existing modal logic for EDIT for now? User said "si edit edit"
    } else {
      // Add mode - Inline
      this.selectedProduct = null;
      this.isAddingProduct.set(true);
    }
  }

  saveProduct(event: any) {
    const shopId = this.shop()?._id;
    if (!shopId) return;

    this.isSavingProduct.set(true);

    // UPDATE EXISTING
    if (event._id) {
      // Destructure to separate product data from variant management arrays
      // Backend updateProduct only expects core product fields
      const { variants, deletedVariantIds, ...productData } = event;

      this.productService.updateProduct(event._id, productData).subscribe({
        next: () => {
          const variantRequests: any[] = [];
          if (variants && Array.isArray(variants)) {
            variants.forEach((v: any) => {
              if (v._id) {
                variantRequests.push(this.variantService.updateVariant(v._id, v));
              } else {
                variantRequests.push(this.variantService.createVariant(event._id, v));
              }
            });
          }
          if (deletedVariantIds && Array.isArray(deletedVariantIds)) {
            deletedVariantIds.forEach((id: string) => {
              variantRequests.push(this.variantService.deleteVariant(id));
            });
          }

          if (variantRequests.length > 0) {
            import('rxjs').then((rxjs) => {
              const { forkJoin, defaultIfEmpty } = rxjs;
              forkJoin(variantRequests)
                .pipe(defaultIfEmpty([]))
                .subscribe(() => {
                  this.isSavingProduct.set(false);
                  this.loadProducts(shopId);
                });
            });
          } else {
            this.isSavingProduct.set(false);
            this.loadProducts(shopId);
          }
        },
        error: () => this.isSavingProduct.set(false),
      });
      return;
    }

    // CREATE NEW
    if (this.isAddingProduct() && event.product && event.variants) {
      const productData = { ...event.product, shop: shopId };
      if (!productData.categories || productData.categories.length === 0) {
        this.toastService.warning('Veuillez sélectionner au moins une catégorie.');
        this.isSavingProduct.set(false);
        return;
      }

      this.productService.createProduct(shopId, productData).subscribe({
        next: (newProduct) => {
          const variantRequests = event.variants.map((v: any) =>
            this.variantService.createVariant(newProduct._id, v),
          );

          import('rxjs').then((rxjs) => {
            const { forkJoin } = rxjs;
            forkJoin(variantRequests).subscribe({
              next: () => {
                this.isSavingProduct.set(false);
                this.isAddingProduct.set(false);
                this.loadProducts(shopId);
                this.toastService.success('Produit créé avec succès !');
              },
              error: (err) => {
                console.error('Error creating variants', err);
                this.isSavingProduct.set(false);
                this.toastService.warning(
                  'Produit créé, mais une erreur est survenue lors de la création des variantes.',
                );
                this.loadProducts(shopId);
              },
            });
          });
        },
        error: (err) => {
          console.error('Error creating product', err);
          this.isSavingProduct.set(false);
          this.toastService.error(
            'Erreur lors de la création du produit. Vérifiez les champs obligatoires.',
          );
        },
      });
    }
  }

  openVariantForm(productId: string) {
    this.currentProductId = productId;
    this.showVariantForm.set(true);
  }

  saveVariant(data: any) {
    this.variantService.createVariant(this.currentProductId, data).subscribe(() => {
      this.showVariantForm.set(false);
      this.loadProducts(this.shop()?._id!);
    });
  }

  openPromotionForm() {
    this.showPromotionForm.set(true);
  }

  savePromotion(data: any) {
    const shopId = this.shop()?._id;
    if (!shopId) return;

    this.promotionService.createPromotion(shopId, data).subscribe(() => {
      this.showPromotionForm.set(false);
    });
  }

  toggleStatus(product: Product) {
    this.productService.setProductActive(product._id, !product.isActive).subscribe(() => {
      this.loadProducts(this.shop()?._id!);
    });
  }

  saveShopSettings(data: any) {
    const id = this.shop()?._id;
    if (!id) return;

    this.shopService.updateShop(id, data).subscribe({
      next: (updatedShop) => {
        this.shop.set(updatedShop);
        this.toastService.success('Paramètres de la boutique mis à jour !');
      },
      error: (err) => console.error('Error updating shop', err),
    });
  }

  onRatingChange(rating: number) {
    const id = this.shop()?._id;
    if (!id) return;

    this.shopService.rateShop(id, rating).subscribe(() => {
      this.userRating.set(rating);
      this.loadShop(id);
    });
  }
}
