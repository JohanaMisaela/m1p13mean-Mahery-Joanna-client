import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductVariant, Category } from '../../../../../shared/models/product.model';
import { ProductVariantService } from '../../../../../core/services/product-variant.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { ProductFormComponent } from './sub-components/product-form/product-form.component';
import { ImageManagementModalComponent } from './sub-components/image-management-modal/image-management-modal.component';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [CommonModule, PaginationComponent, FormsModule, ProductFormComponent, ImageManagementModalComponent],
    templateUrl: './product-management.component.html',
})
export class ProductManagementComponent {
    private variantService = inject(ProductVariantService);

    @Input() products: Product[] = [];
    @Input() categories: Category[] = [];
    @Input() currentPage: number = 1;
    @Input() total: number = 0;
    @Input() limit: number = 20;
    @Input() isAddingProduct = false;

    @Output() editProduct = new EventEmitter<Product>();
    @Output() toggleStatus = new EventEmitter<Product>();
    @Output() manageVariants = new EventEmitter<Product>();
    @Output() refresh = new EventEmitter<void>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() saveNewProduct = new EventEmitter<any>();
    @Output() cancelAddProduct = new EventEmitter<void>();

    expandedProductId: string | null = null;
    editingProductId: string | null = null;

    // Image modal state
    showImageModal = false;
    currentEditingVariant: any = null;

    get totalPages(): number {
        return Math.ceil(this.total / this.limit);
    }

    toggleExpand(productId: string) {
        if (this.editingProductId) return;
        this.expandedProductId = this.expandedProductId === productId ? null : productId;
    }

    onToggleStatus(product: Product) {
        this.toggleStatus.emit(product);
    }

    startEdit(product: Product) {
        this.editingProductId = product._id;
    }

    cancelEdit() {
        this.editingProductId = null;
        if (this.isAddingProduct) {
            this.cancelAddProduct.emit();
        }
    }

    onSaveProduct(event: { product: any, variants: any[] }) {
        this.saveNewProduct.emit(event);
        this.editingProductId = null;
    }

    openImageModal(variant: any) {
        this.currentEditingVariant = variant;
        this.showImageModal = true;
    }

    closeImageModal() {
        this.showImageModal = false;
        this.currentEditingVariant = null;
    }

    toggleVariantStatus(variant: ProductVariant) {
        this.variantService.updateVariant(variant._id, { isActive: !variant.isActive }).subscribe(() => {
            variant.isActive = !variant.isActive;
            this.refresh.emit();
        });
    }
}
