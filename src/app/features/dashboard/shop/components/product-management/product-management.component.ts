import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductVariant, Category } from '../../../../../shared/models/product.model';
import { ProductVariantService } from '../../../../../core/services/product-variant.service';
import { CategoryService } from '../../../../../core/services/category.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [CommonModule, PaginationComponent, FormsModule],
    templateUrl: './product-management.component.html',
})
export class ProductManagementComponent implements OnChanges {
    private variantService = inject(ProductVariantService);
    private categoryService = inject(CategoryService);

    @Input() products: Product[] = [];
    @Input() categories: Category[] = [];
    @Input() currentPage: number = 1;
    @Input() total: number = 0;
    @Input() limit: number = 50;

    @Input() isAddingProduct = false;

    @Output() editProduct = new EventEmitter<Product>(); // Legacy or handled internally now
    @Output() toggleStatus = new EventEmitter<Product>();
    @Output() manageVariants = new EventEmitter<Product>();
    @Output() refresh = new EventEmitter<void>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() saveNewProduct = new EventEmitter<any>();
    @Output() cancelAddProduct = new EventEmitter<void>();
    @Output() openAddProduct = new EventEmitter<void>();

    // Editing State
    editingProductId: string | null = null;
    editForm: any = null; // Snapshot for editing

    // New Product Form State
    newProduct: any = {
        name: '',
        description: '',
        categories: [], // Array of Category IDs
        tags: '', // comma separated string for input
    };

    // Category Creation
    showNewCategoryInput = false;
    newCategoryName = '';

    // Variants with dynamic attributes
    // Structure: { price, stock, sku, attributes: [{key: 'Color', value: 'Red'}] }
    newVariants: any[] = [];

    constructor() {
        this.resetForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isAddingProduct'] && changes['isAddingProduct'].currentValue === true) {
            this.resetForm();
        }
    }

    addVariantRow() {
        this.newVariants.push({
            sku: '',
            stock: 0,
            price: 0,
            imageUrl: '',
            attributes: [{ key: '', value: '' }]
        });
    }

    removeVariantRow(index: number) {
        if (this.newVariants.length > 1) {
            this.newVariants.splice(index, 1);
        }
    }

    // Dynamic Attribute Helpers
    addAttributeToVariant(variantIndex: number) {
        this.newVariants[variantIndex].attributes.push({ key: '', value: '' });
    }

    removeAttributeFromVariant(variantIndex: number, attrIndex: number) {
        this.newVariants[variantIndex].attributes.splice(attrIndex, 1);
    }

    onSaveNewProduct() {
        // Basic validation
        if (!this.newProduct.name || this.newVariants.length === 0) return;

        // Process tags
        const tags = this.newProduct.tags ? this.newProduct.tags.split(',').map((t: string) => t.trim()) : [];

        // Transform Attributes from Array back to Object
        const variantsPayload = this.newVariants.map(v => {
            const attrMap: any = {};
            v.attributes.forEach((a: any) => {
                if (a.key && a.value) attrMap[a.key] = a.value;
            });
            return {
                ...v,
                attributes: attrMap,
                images: v.imageUrl ? [v.imageUrl] : [] // Transform to array
            };
        });

        // Format payload
        const payload = {
            product: {
                ...this.newProduct,
                tags,
                categories: this.newProduct.categories
            },
            variants: variantsPayload
        };

        this.saveNewProduct.emit(payload);
    }

    onCreateCategory() {
        const name = this.newCategoryName.trim();
        if (!name) return;

        // Add to active form categories if not already there
        const targetForm = this.editingProductId ? this.editForm : this.newProduct;

        if (targetForm && targetForm.categories) {
            if (!targetForm.categories.includes(name)) {
                targetForm.categories.push(name);
            }
        }

        this.newCategoryName = '';
        this.showNewCategoryInput = false;
    }

    toggleCategorySelection(categoryIdOrName: string, form: any) {
        if (!form.categories) form.categories = [];
        const index = form.categories.indexOf(categoryIdOrName);
        if (index > -1) {
            form.categories.splice(index, 1);
        } else {
            form.categories.push(categoryIdOrName);
        }
    }

    isCategorySelected(categoryIdOrName: string, form: any): boolean {
        return form.categories && form.categories.includes(categoryIdOrName);
    }

    getCategoryName(idOrName: string): string {
        const cat = this.categories.find(c => c._id === idOrName);
        return cat ? cat.name : idOrName;
    }

    onCancelAdd() {
        this.cancelAddProduct.emit();
        this.resetForm();
    }

    resetForm() {
        this.newProduct = { name: '', description: '', categories: [], tags: '' };
        this.newVariants = [{
            sku: '',
            stock: 0,
            price: 0,
            imageUrl: '',
            attributes: [{ key: '', value: '' }]
        }];
    }

    // --- Edit Mode Logic ---

    startEdit(product: Product) {
        this.editingProductId = product._id;

        // Deep copy for form snapshot
        this.editForm = {
            ...product,
            categories: product.categories?.map(c => c._id) || [product.category?._id].filter(id => !!id),
            tags: product.tags ? product.tags.join(', ') : '',
            variants: product.variants ? product.variants.map(v => ({
                ...v,
                imageUrl: v.images?.[0] || '',
                attributes: v.attributes ? Object.keys(v.attributes).map(key => ({ key, value: v.attributes[key] })) : []
            })) : []
        };

        // If no variants in existing product, init one
        if (!this.editForm.variants || this.editForm.variants.length === 0) {
            this.editForm.variants = [{ sku: '', price: 0, stock: 0, imageUrl: '', attributes: [] }];
        }
    }

    cancelEdit() {
        this.editingProductId = null;
        this.editForm = null;
    }

    saveEdit() {
        if (!this.editForm) return;

        // Process tags
        const tags = this.editForm.tags ? this.editForm.tags.split(',').map((t: string) => t.trim()) : [];

        // Transform Attributes
        const variantsPayload = this.editForm.variants.map((v: any) => {
            const attrMap: any = {};
            v.attributes.forEach((a: any) => {
                if (a.key && a.value) attrMap[a.key] = a.value;
            });
            return {
                ...v,
                attributes: attrMap,
                images: v.imageUrl ? [v.imageUrl] : v.images || []
            };
        });

        const payload = {
            ...this.editForm,
            tags,
            categories: this.editForm.categories,
            variants: variantsPayload
        };

        this.saveNewProduct.emit(payload);
        this.editingProductId = null;
        this.editForm = null;
    }

    // --- Dynamic attribute helpers for Edit Form ---
    addVariantRowToEdit() {
        this.editForm.variants.push({
            sku: '',
            price: 0,
            stock: 0,
            imageUrl: '',
            attributes: [{ key: '', value: '' }]
        });
    }

    removeVariantRowFromEdit(index: number) {
        if (this.editForm.variants.length > 1) {
            this.editForm.variants.splice(index, 1);
        }
    }
    addAttributeToEditVariant(variantIndex: number) {
        this.editForm.variants[variantIndex].attributes.push({ key: '', value: '' });
    }

    removeAttributeFromEditVariant(variantIndex: number, attrIndex: number) {
        this.editForm.variants[variantIndex].attributes.splice(attrIndex, 1);
    }


    get totalPages(): number {
        return Math.ceil(this.total / this.limit);
    }

    expandedProductId: string | null = null;

    toggleExpand(productId: string) {
        if (this.editingProductId) return; // Don't toggle expanded if editing (or maybe yes?)

        if (this.expandedProductId === productId) {
            this.expandedProductId = null;
        } else {
            this.expandedProductId = productId;
        }
    }

    onToggleStatus(product: Product) {
        this.toggleStatus.emit(product);
    }

    toggleVariantStatus(variant: ProductVariant) {
        this.variantService.updateVariant(variant._id, { isActive: !variant.isActive }).subscribe(() => {
            variant.isActive = !variant.isActive;
            this.refresh.emit();
        });
    }

    // --- Image Upload Helpers ---

    onFileSelected(event: any, variant: any) {
        const file = event.target.files[0];
        if (file) {
            this.convertFileToBase64(file).then(base64 => {
                variant.imageUrl = base64;
            });
        }
    }

    private convertFileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
}

