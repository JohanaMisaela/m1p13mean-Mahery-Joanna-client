import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, Category } from '../../../../../../../shared/models/product.model';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
    @Input() product: any = null; // If null, we are in Add mode
    @Input() categories: Category[] = [];
    @Input() isEdit = false;
    @Input() loading = false;

    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();
    @Output() createCategory = new EventEmitter<string>();
    @Output() openImageModal = new EventEmitter<any>();

    private cdr = inject(ChangeDetectorRef);

    form: any = {
        name: '',
        description: '',
        categories: [],
        tags: '',
        variants: []
    };

    showNewCategoryInput = false;
    newCategoryName = '';

    ngOnInit() {
        console.log('ProductForm: Initializing. EditMode:', this.isEdit, 'Product:', this.product);
        console.log('ProductForm: Initial Categories:', this.categories);
        if (this.isEdit && this.product) {
            this.initEditForm();
        } else {
            this.initAddForm();
        }
    }

    initAddForm() {
        console.log('ProductForm: initAddForm called');
        this.form = {
            name: '',
            description: '',
            categories: [],
            tags: '',
            variants: [{ sku: '', price: 0, stock: 0, images: [], attributes: [{ key: '', value: '' }], isActive: true }]
        };
    }

    initEditForm() {
        const p = this.product;
        console.log('ProductForm: initEditForm for product:', p._id);

        // Robust category mapping
        let categoryIds: string[] = [];
        if (p.categories && Array.isArray(p.categories)) {
            categoryIds = p.categories.map((c: any) => {
                const id = typeof c === 'string' ? c : c._id;
                console.log('ProductForm: Mapping category object/id to string:', c, '->', id);
                return id;
            }).filter((id: string) => !!id);
        }

        // Check single category field as well
        if (p.category) {
            const singleId = typeof p.category === 'string' ? p.category : p.category._id;
            if (singleId && !categoryIds.includes(singleId)) {
                categoryIds.push(singleId);
            }
        }

        this.form = {
            ...p,
            categories: categoryIds,
            tags: p.tags ? p.tags.join(', ') : '',
            variants: p.variants ? p.variants.map((v: any) => ({
                ...v,
                isActive: v.isActive !== false, // Explicitly handle true/false/undefined
                images: v.images || [],
                attributes: Array.isArray(v.attributes) ? [...v.attributes] :
                    (v.attributes && typeof v.attributes === 'object' ?
                        Object.entries(v.attributes).map(([key, value]) => ({ key, value: String(value) })) :
                        [{ key: '', value: '' }]) // Fallback to one empty attribute row if needed or just empty array
            })) : []
        };

        if (!this.form.variants || this.form.variants.length === 0) {
            this.form.variants = [{ sku: '', price: 0, stock: 0, images: [], attributes: [{ key: '', value: '' }], isActive: true }];
        }
    }

    toggleCategorySelection(categoryId: string) {
        if (!this.form.categories) this.form.categories = [];
        const index = this.form.categories.indexOf(categoryId);
        if (index > -1) {
            this.form.categories.splice(index, 1);
        } else {
            this.form.categories.push(categoryId);
        }
    }

    isCategorySelected(categoryId: string): boolean {
        if (!this.form.categories || !Array.isArray(this.form.categories)) return false;
        return this.form.categories.includes(categoryId);
    }

    getCategoryName(idOrObj: any): string {
        if (!idOrObj) return 'N/A';

        const id = typeof idOrObj === 'string' ? idOrObj : idOrObj._id;
        if (!id) return typeof idOrObj === 'object' ? (idOrObj.name || 'Sans Nom') : String(idOrObj);

        const cats = Array.isArray(this.categories) ? this.categories : [];
        if (cats.length === 0) return (idOrObj.name || id);

        const cat = cats.find(c => c._id === id);
        return cat ? cat.name : (idOrObj.name || id);
    }

    onCreateCategory() {
        if (this.newCategoryName.trim()) {
            console.log('ProductForm: Emitting createCategory:', this.newCategoryName);
            this.createCategory.emit(this.newCategoryName);
            this.newCategoryName = '';
            this.showNewCategoryInput = false;
        }
    }

    addVariant() {
        console.log('ProductForm: addVariant clicked. Current variants count:', this.form.variants?.length);
        if (!this.form.variants) this.form.variants = [];
        this.form.variants.push({
            sku: '',
            price: 0,
            stock: 0,
            images: [],
            attributes: [{ key: '', value: '' }],
            isActive: true
        });
        console.log('ProductForm: Variant added. New count:', this.form.variants.length);
        this.cdr.detectChanges();
    }

    removeVariant(index: number) {
        // Only allow removing if it's a new variant (no _id)
        if (!this.form.variants[index]._id) {
            console.log('ProductForm: Removing new variant at index:', index);
            this.form.variants.splice(index, 1);
            this.cdr.detectChanges();
        } else {
            console.log('ProductForm: Cannot remove existing variant with _id. Consider toggling isActive instead.');
        }
    }

    addAttribute(variantIndex: number) {
        console.log('ProductForm: addAttribute for variant:', variantIndex);
        if (!this.form.variants[variantIndex].attributes) {
            this.form.variants[variantIndex].attributes = [];
        }
        this.form.variants[variantIndex].attributes.push({ key: '', value: '' });
        this.cdr.detectChanges();
    }

    removeAttribute(variantIndex: number, attrIndex: number) {
        this.form.variants[variantIndex].attributes.splice(attrIndex, 1);
    }

    removeImage(variant: any, index: number) {
        if (variant && variant.images && Array.isArray(variant.images)) {
            variant.images.splice(index, 1);
            this.cdr.detectChanges();
        }
    }

    onSave() {
        // Validation: Check for duplicate SKUs within the form
        const skus = this.form.variants
            .map((v: any) => v.sku?.trim())
            .filter((sku: string) => !!sku);

        const hasDuplicateSkus = new Set(skus).size !== skus.length;
        if (hasDuplicateSkus) {
            alert('Erreur: Vous avez des SKUs en double dans vos variantes. Chaque SKU doit être unique.');
            return;
        }

        // Transform tags
        const tagsArray = typeof this.form.tags === 'string'
            ? this.form.tags.split(',').map((t: string) => t.trim()).filter((t: string) => !!t)
            : this.form.tags;

        // Transform variant attributes from array [{key, value}] to object {key: value}
        // This is required by the backend which expects a Map/Object
        const transformedVariants = this.form.variants.map((v: any) => {
            const attributesObj: { [key: string]: string } = {};
            if (Array.isArray(v.attributes)) {
                v.attributes.forEach((attr: any) => {
                    if (attr.key && attr.key.trim()) {
                        attributesObj[attr.key.trim()] = attr.value;
                    }
                });
            }

            // Create a clean copy for the representative payload
            const variantCopy = {
                ...v,
                attributes: attributesObj
            };

            // Clean up SKU: trim it, and if empty, remove it to avoid unique constraint collisions in MongoDB
            if (variantCopy.sku) {
                variantCopy.sku = variantCopy.sku.trim();
                if (variantCopy.sku === '') {
                    delete variantCopy.sku;
                }
            } else {
                delete variantCopy.sku;
            }

            // Also remove populated objects that might be present
            if (variantCopy.product && typeof variantCopy.product === 'object') {
                variantCopy.product = variantCopy.product._id;
            }

            return variantCopy;
        });

        if (this.isEdit) {
            // For Edit Mode: Emit the full form object which contains _id and variants
            const payload = {
                ...this.form,
                tags: tagsArray,
                variants: transformedVariants
            };
            this.save.emit(payload);
        } else {
            // For Add Mode: Emit the { product, variants } structure expected by ShopManagementComponent
            // We remove variants from the product object to avoid double data
            const { variants, ...productOnly } = this.form;
            const payload = {
                product: {
                    ...productOnly,
                    tags: tagsArray
                },
                variants: transformedVariants
            };
            this.save.emit(payload);
        }
    }
}
