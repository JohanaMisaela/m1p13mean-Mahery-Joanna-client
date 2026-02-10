import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';
import { ProductService } from '../../core/services/product.service';
import { ProductVariantService } from '../../core/services/product-variant.service';
import { PromotionService } from '../../core/services/promotion.service';
import { Shop, Product } from '../../shared/models/product.model';
import { ProductFormComponent } from './product-form.component';
import { VariantFormComponent } from './variant-form.component';
import { PromotionFormModalComponent } from './promotion-form.component';

@Component({
    selector: 'app-shop-management',
    standalone: true,
    imports: [CommonModule, ProductFormComponent, VariantFormComponent, PromotionFormModalComponent],
    template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <!-- Header -->
      <div class="mb-8 flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h1 class="text-4xl font-light text-gray-900 mb-2">{{ shop()?.name }}</h1>
          <p class="text-gray-500 italic">{{ shop()?.slogan }}</p>
        </div>
        <div class="flex space-x-4">
          <button (click)="openProductForm()" 
                  class="bg-black text-white px-6 py-2 uppercase tracking-widest text-sm hover:bg-gray-800 transition-all shadow-lg active:scale-95">
            Ajouter Produit
          </button>
          <button (click)="openPromotionForm()" 
                  class="border border-black text-black px-6 py-2 uppercase tracking-widest text-sm hover:bg-gray-50 transition-all active:scale-95">
            Nouvelle Promotion
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="p-6 bg-gray-50 border border-gray-100">
              <span class="text-xs text-gray-400 uppercase tracking-widest block mb-1">Produits</span>
              <span class="text-2xl font-semibold">{{ products().length }}</span>
          </div>
          <div class="p-6 bg-gray-50 border border-gray-100">
              <span class="text-xs text-gray-400 uppercase tracking-widest block mb-1">Status Boutique</span>
              <span [class]="'text-sm font-bold ' + (shop()?.isActive ? 'text-green-600' : 'text-red-600') + ' uppercase tracking-widest'">
                  {{ shop()?.isActive ? 'Actif' : 'Inactif' }}
              </span>
          </div>
          <div class="p-6 bg-gray-50 border border-gray-100">
              <span class="text-xs text-gray-400 uppercase tracking-widest block mb-1">Emplacement</span>
              <span class="text-sm font-medium uppercase tracking-wider">{{ shop()?.mallBoxNumber }}</span>
          </div>
      </div>

      <!-- Product List -->
      <div class="bg-white">
        <h3 class="text-lg font-semibold mb-6 uppercase tracking-widest border-l-4 border-black pl-4">Gestion des Produits</h3>
        
        <div class="grid grid-cols-1 gap-4">
          <div *ngFor="let product of products()" 
               class="group p-6 border border-gray-100 hover:border-black transition-all flex flex-col md:flex-row md:items-center justify-between">
            
            <div class="flex items-center mb-4 md:mb-0">
               <div class="h-16 w-16 bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                   <img *ngIf="product.images?.length" [src]="product.images[0]" class="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all">
                   <div *ngIf="!product.images?.length" class="h-full w-full flex items-center justify-center text-[10px] text-gray-300">NO IMG</div>
               </div>
               <div class="ml-6">
                 <h4 class="font-medium text-lg">{{ product.name }}</h4>
                 <div class="flex items-center space-x-4 mt-1 text-sm text-gray-500 uppercase tracking-tighter">
                    <span>{{ product.price | currency:'AR ':'symbol':'1.0-0' }}</span>
                    <span>•</span>
                    <span>Stock: {{ product.stock }}</span>
                    <span *ngIf="!product.isActive" class="text-red-500 font-bold ml-2">[INACTIF]</span>
                 </div>
               </div>
            </div>

            <div class="flex space-x-2">
               <button (click)="openProductForm(product)" class="text-xs uppercase tracking-widest border border-gray-200 px-4 py-2 hover:bg-black hover:text-white transition-all">Editer</button>
               <button (click)="openVariantForm(product._id)" class="text-xs uppercase tracking-widest border border-gray-200 px-4 py-2 hover:bg-black hover:text-white transition-all">Variantes</button>
               <button (click)="toggleStatus(product)" 
                       [class]="'text-xs uppercase tracking-widest border px-4 py-2 transition-all ' + (product.isActive ? 'border-red-100 text-red-400 hover:bg-red-500 hover:text-white' : 'border-green-100 text-green-400 hover:bg-green-500 hover:text-white')">
                   {{ product.isActive ? 'Désactiver' : 'Activer' }}
               </button>
            </div>
          </div>

          <div *ngIf="products().length === 0" class="py-20 text-center border-2 border-dashed border-gray-100">
              <p class="text-gray-400 italic">Aucun produit pour cette boutique.</p>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <app-product-form *ngIf="showProductForm()" 
                        [editMode]="!!selectedProduct" 
                        [initialData]="selectedProduct"
                        (close)="showProductForm.set(false)"
                        (save)="saveProduct($event)">
      </app-product-form>

      <app-variant-form *ngIf="showVariantForm()"
                        (close)="showVariantForm.set(false)"
                        (save)="saveVariant($event)">
      </app-variant-form>

      <app-promotion-form *ngIf="showPromotionForm()"
                          (close)="showPromotionForm.set(false)"
                          (save)="savePromotion($event)">
      </app-promotion-form>

    </div>
  `,
    styles: []
})
export class ShopManagementComponent implements OnInit {
    private readonly shopService = inject(ShopService);
    private readonly productService = inject(ProductService);
    private readonly variantService = inject(ProductVariantService);
    private readonly promotionService = inject(PromotionService);
    private readonly route = inject(ActivatedRoute);

    shop = signal<Shop | null>(null);
    products = signal<Product[]>([]);

    showProductForm = signal(false);
    showVariantForm = signal(false);
    showPromotionForm = signal(false);

    selectedProduct: any = null;
    currentProductId: string = '';

    ngOnInit() {
        const shopId = this.route.snapshot.paramMap.get('id');
        if (shopId) {
            this.loadShop(shopId);
            this.loadProducts(shopId);
        }
    }

    loadShop(id: string) {
        this.shopService.getShopById(id).subscribe(s => this.shop.set(s));
    }

    loadProducts(shopId: string) {
        this.productService.getProducts({ shop: shopId, isActive: 'all' }).subscribe((res: any) => {
            const data = Array.isArray(res) ? res : (res.data || []);
            this.products.set(data);
        });
    }

    openProductForm(product?: any) {
        this.selectedProduct = product || null;
        this.showProductForm.set(true);
    }

    saveProduct(data: any) {
        const shopId = this.shop()?._id;
        if (!shopId) return;

        if (this.selectedProduct) {
            this.productService.updateProduct(this.selectedProduct._id, data).subscribe(() => {
                this.showProductForm.set(false);
                this.loadProducts(shopId);
            });
        } else {
            this.productService.createProduct(shopId, data).subscribe(() => {
                this.showProductForm.set(false);
                this.loadProducts(shopId);
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
}
