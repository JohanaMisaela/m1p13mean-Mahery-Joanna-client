import { Component, OnInit, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ShopService } from '../../../../core/services/shop.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductService } from '../../../../core/services/product.service';
import { ProductVariantService } from '../../../../core/services/product-variant.service';
import { PromotionService } from '../../../../core/services/promotion.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Shop, Product, Category } from '../../../../shared/models/product.model';
import { ShopHeaderComponent } from '../components/shop-header/shop-header.component';
import { ShopSettingsFormComponent } from '../components/shop-settings-form/shop-settings-form.component';
import { FooterComponent } from '../../../../core/layout/footer/footer.component';

import { ProductManagementComponent } from '../components/product-management/product-management.component';
import { ReportManagementComponent } from '../components/report-management/report-management.component';

@Component({
    selector: 'app-shop-management',
    standalone: true,
    imports: [CommonModule, RouterModule, ShopHeaderComponent, ShopSettingsFormComponent, ProductManagementComponent, ReportManagementComponent, FooterComponent],
    templateUrl: './shop-management.component.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            min-height: 0;
            height: 100%;
        }
    `]
})
export class ShopManagementComponent implements OnInit {
    private readonly shopService = inject(ShopService);
    private readonly productService = inject(ProductService);
    private readonly variantService = inject(ProductVariantService);
    private readonly promotionService = inject(PromotionService);
    private readonly categoryService = inject(CategoryService);
    private readonly authService = inject(AuthService);
    private readonly route = inject(ActivatedRoute);

    protected userRating = signal<number>(0);


    currentUser = this.authService.currentUser;
    activeView = signal<'preview' | 'settings' | 'products' | 'promotions' | 'orders' | 'reports'>('products');

    shop = signal<Shop | null>(null);
    products = signal<Product[]>([]);
    categories = signal<Category[]>([]);
    productTotal = signal(0);
    productPage = signal(1);
    productLimit = signal(50);

    isAddingProduct = signal(false);

    showProductForm = signal(false);
    showVariantForm = signal(false);
    showPromotionForm = signal(false);

    selectedProduct: any = null;
    currentProductId: string = '';

    constructor() {
        afterNextRender(() => {
            const shopId = this.route.snapshot.paramMap.get('id');
            if (shopId) {
                this.loadShop(shopId);
                this.loadProducts(shopId);
                this.loadCategories();
                if (this.currentUser()) {
                    this.loadUserRating(shopId);
                }
            }
        });
    }

    ngOnInit() { }

    loadShop(id: string) {
        this.shopService.getShopById(id).subscribe(s => this.shop.set(s));
    }

    loadCategories() {
        console.log('ShopManagement: Loading categories...');
        this.categoryService.getCategories().subscribe({
            next: (res: any) => {
                const data = Array.isArray(res) ? res : (res.data || []);
                console.log('ShopManagement: Categories parsed:', data);
                this.categories.set(data);
            },
            error: (err) => console.error('ShopManagement: Error loading categories:', err)
        });
    }

    loadUserRating(shopId: string) {
        this.shopService.getMyShopRating(shopId).subscribe({
            next: (res) => this.userRating.set(res?.rating || 0),
            error: () => this.userRating.set(0)
        });
    }

    loadProducts(shopId: string) {
        this.productService.getProducts({
            shop: shopId,
            isActive: 'all',
            page: this.productPage(),
            limit: this.productLimit()
        }).subscribe((res: any) => {
            const data = Array.isArray(res) ? res : (res.data || []);
            this.products.set(data);
            this.productTotal.set(res.total || data.length);
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

        // UPDATE EXISTING
        if (event._id) {
            this.productService.updateProduct(event._id, event).subscribe({
                next: () => {
                    // Handle Variants Sync
                    // 1. Create new variants (no _id)
                    // 2. Update existing variants (has _id)
                    // 3. Delete removed variants (passed in event.deletedVariantIds) - TODO: Add granular delete support if needed, 
                    //    for now assuming we just update/create.

                    const variantRequests: any[] = [];

                    if (event.variants && Array.isArray(event.variants)) {
                        event.variants.forEach((v: any) => {
                            if (v._id) {
                                // Update existing
                                variantRequests.push(this.variantService.updateVariant(v._id, v));
                            } else {
                                // Create new for this product
                                variantRequests.push(this.variantService.createVariant(event._id, v));
                            }
                        });
                    }

                    // Handle deletions if provided
                    if (event.deletedVariantIds && Array.isArray(event.deletedVariantIds)) {
                        event.deletedVariantIds.forEach((id: string) => {
                            variantRequests.push(this.variantService.deleteVariant(id));
                        });
                    }

                    if (variantRequests.length > 0) {
                        import('rxjs').then(rxjs => {
                            const { forkJoin, defaultIfEmpty } = rxjs;
                            forkJoin(variantRequests).pipe(defaultIfEmpty([])).subscribe(() => {
                                this.loadProducts(shopId);
                                // Close edit form handled by child logic? 
                                // Actually child emits, parent reloads. 
                                // We need to tell child to stop editing? 
                                // The child manages its own `editingProductId` state, but we assume it resets on success?
                                // Actually, we don't have a way to tell child "Success".
                                // But since we reload products, the child will verify `products` input changes. 
                                // However, `editingProductId` is local state.
                                // We might need to toggle it off.
                            });
                        });
                    } else {
                        this.loadProducts(shopId);
                    }
                }
            });
            return;
        }

        // CREATE NEW
        if (this.isAddingProduct() && event.product && event.variants) {
            // Ensure shop ID is included in product data for backend validation
            const productData = {
                ...event.product,
                shop: shopId
            };

            // Basic frontend validation for category
            if (!productData.categories || productData.categories.length === 0) {
                alert('Veuillez sélectionner au moins une catégorie.');
                return;
            }

            this.productService.createProduct(shopId, productData).subscribe({
                next: (newProduct) => {
                    // Create all variants for the new product
                    const variantRequests = event.variants.map((v: any) =>
                        this.variantService.createVariant(newProduct._id, v)
                    );

                    import('rxjs').then(rxjs => {
                        const { forkJoin } = rxjs;
                        forkJoin(variantRequests).subscribe({
                            next: () => {
                                this.isAddingProduct.set(false);
                                this.loadProducts(shopId);
                                alert('Produit créé avec succès !');
                            },
                            error: (err) => {
                                console.error('Error creating variants', err);
                                alert('Produit créé, mais une erreur est survenue lors de la création des variantes.');
                                this.loadProducts(shopId); // Still reload to show the product
                            }
                        });
                    });
                },
                error: (err) => {
                    console.error('Error creating product', err);
                    alert('Erreur lors de la création du produit. Vérifiez les champs obligatoires.');
                }
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
                alert('Paramètres de la boutique mis à jour !');
            },
            error: (err) => console.error('Error updating shop', err)
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
