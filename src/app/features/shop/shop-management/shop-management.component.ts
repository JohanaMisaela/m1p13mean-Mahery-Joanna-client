import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductVariantService } from '../../../core/services/product-variant.service';
import { PromotionService } from '../../../core/services/promotion.service';
import { Shop, Product } from '../../../shared/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';
import { VariantFormComponent } from '../variant-form/variant-form.component';
import { PromotionFormModalComponent } from '../promotion-form/promotion-form.component';

@Component({
    selector: 'app-shop-management',
    standalone: true,
    imports: [CommonModule, ProductFormComponent, VariantFormComponent, PromotionFormModalComponent],
    templateUrl: './shop-management.component.html',
    styleUrls: []
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
