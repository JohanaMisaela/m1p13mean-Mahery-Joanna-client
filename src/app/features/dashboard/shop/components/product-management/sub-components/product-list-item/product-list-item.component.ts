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
}
