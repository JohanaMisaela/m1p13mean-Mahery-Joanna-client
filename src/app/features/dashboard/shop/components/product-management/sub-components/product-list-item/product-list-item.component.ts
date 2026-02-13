import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductVariant } from '../../../../../../../shared/models/product.model';
import { ProductVariantService } from '../../../../../../../core/services/product-variant.service';

@Component({
    selector: 'tr[app-product-list-item]',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-list-item.component.html',
})
export class ProductManagementListItemComponent {
    private variantService = inject(ProductVariantService);

    @Input() product!: Product;
    @Input() promotions: any[] = [];
    @Input() isExpanded = false;
    @Input() isEditing = false;
    @Input() reportCount = 0;

    @Output() expandToggle = new EventEmitter<void>();
    @Output() statusToggle = new EventEmitter<void>();
    @Output() editStart = new EventEmitter<void>();
    @Output() refresh = new EventEmitter<void>();

    onToggleExpand() {
        this.expandToggle.emit();
    }

    onToggleStatus() {
        this.statusToggle.emit();
    }

    onStartEdit() {
        this.editStart.emit();
    }

    onToggleVariantStatus(variant: ProductVariant) {
        this.variantService.updateVariant(variant._id, { isActive: !variant.isActive }).subscribe(() => {
            variant.isActive = !variant.isActive;
            this.refresh.emit();
        });
    }

    isVariantInPromotion(variantId: string): boolean {
        return this.promotions.some(promo => promo.products?.includes(variantId));
    }

    getVariantPromotionDiscount(variantId: string): number {
        const promo = this.promotions.find(promo => promo.products?.includes(variantId));
        return promo?.discountPercentage || 0;
    }
}
