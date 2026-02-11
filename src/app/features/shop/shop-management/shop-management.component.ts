import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Ensure RouterModule is imported here
import { ShopService } from '../../../core/services/shop.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductVariantService } from '../../../core/services/product-variant.service';
import { PromotionService } from '../../../core/services/promotion.service';
import { Shop, Product } from '../../../shared/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';
import { VariantFormComponent } from '../variant-form/variant-form.component';
import { PromotionFormModalComponent } from '../promotion-form/promotion-form.component';
import { ShopHeaderComponent } from '../components/shop-header/shop-header.component';
import { ShopSettingsFormComponent } from '../components/shop-settings-form/shop-settings-form.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';

@Component({
    selector: 'app-shop-management',
    standalone: true,
    imports: [CommonModule, RouterModule, ProductFormComponent, VariantFormComponent, PromotionFormModalComponent, ShopHeaderComponent, ShopSettingsFormComponent, FooterComponent], // Add FooterComponent here
    templateUrl: './shop-management.component.html',
    styles: [`
        :host {
            display: block;
            height: 100%;
        }
    `]
})
export class ShopManagementComponent implements OnInit {
    private readonly shopService = inject(ShopService);
    private readonly productService = inject(ProductService);
    private readonly variantService = inject(ProductVariantService);
    private readonly promotionService = inject(PromotionService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);

    protected userRating = signal<number>(0);


    currentUser = this.authService.currentUser;
    activeView = signal<'preview' | 'settings' | 'products' | 'promotions' | 'orders' | 'reports'>('products'); // Default to products for now or preview

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
            if (this.currentUser()) {
                this.loadUserRating(shopId);
            }
        }
    }

    loadShop(id: string) {
        this.shopService.getShopById(id).subscribe(s => this.shop.set(s));
    }

    loadUserRating(shopId: string) {
        this.shopService.getMyShopRating(shopId).subscribe({
            next: (res) => this.userRating.set(res?.rating || 0),
            error: () => this.userRating.set(0)
        });
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

    saveShopSettings(data: any) {
        const id = this.shop()?._id;
        if (!id) return;

        this.shopService.updateShop(id, data).subscribe({
            next: (updatedShop) => {
                this.shop.set(updatedShop);
                // Optionally show success message
                alert('Paramètres de la boutique mis à jour !');
            },
            error: (err) => console.error('Error updating shop', err)
        });
    }

    onRatingChange(rating: number) {
        // In admin/management mode, we might just log or allow rating if desired.
        // For now, let's allow the owner to rate their own shop if the backend allows it (usually not, but for preview/testing)
        const id = this.shop()?._id;
        if (!id) return;

        this.shopService.rateShop(id, rating).subscribe(() => {
            this.userRating.set(rating);
            this.loadShop(id);
        });
    }
}
