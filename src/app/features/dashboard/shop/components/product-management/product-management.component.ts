import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductVariant, Category } from '../../../../../shared/models/product.model';
import { ProductVariantService } from '../../../../../core/services/product-variant.service';
import { ReportService } from '../../../../../core/services/report.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { ProductFormComponent } from './sub-components/product-form/product-form.component';
import { ImageManagementModalComponent } from './sub-components/image-management-modal/image-management-modal.component';
import { ProductManagementListItemComponent } from './sub-components/product-list-item/product-list-item.component';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [CommonModule, PaginationComponent, FormsModule, ProductFormComponent, ImageManagementModalComponent, ProductManagementListItemComponent],
    templateUrl: './product-management.component.html',
})
export class ProductManagementComponent implements OnChanges {
    private variantService = inject(ProductVariantService);
    private reportService = inject(ReportService);

    @Input() shopId!: string;
    @Input() products: Product[] = [];
    @Input() categories: Category[] = [];
    @Input() currentPage: number = 1;
    @Input() total: number = 0;
    @Input() limit: number = 20;
    @Input() isAddingProduct = false;
    @Input() isSavingProduct = false;

    @Output() editProduct = new EventEmitter<Product>();
    @Output() toggleStatus = new EventEmitter<Product>();
    @Output() manageVariants = new EventEmitter<Product>();
    @Output() refresh = new EventEmitter<void>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() saveNewProduct = new EventEmitter<any>();
    @Output() cancelAddProduct = new EventEmitter<void>();

    productReports = signal<any[]>([]);
    productReportCounts = signal<{ [key: string]: number }>({});

    expandedProductId: string | null = null;
    editingProductId: string | null = null;

    // Image modal state
    showImageModal = false;
    currentEditingVariant: any = null;

    get totalPages(): number {
        return Math.ceil(this.total / this.limit);
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes['products'] || changes['shopId']) && this.products && this.shopId) {
            this.loadReportCounts();
        }
    }

    loadReportCounts() {
        this.reportService.getShopReports(this.shopId, { status: 'pending', targetType: 'product' }).subscribe(res => {
            this.productReports.set(res.data || []);

            // Map counts
            const counts: { [key: string]: number } = {};
            this.products.forEach(p => {
                counts[p._id] = (res.data || []).filter((r: any) => r.targetId === p._id).length;
            });
            this.productReportCounts.set(counts);
        });
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

    onSaveProduct(event: any) {
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
