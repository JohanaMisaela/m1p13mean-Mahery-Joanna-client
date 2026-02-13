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
            variants: [{ sku: '', price: 0, stock: 0, images: [], attributes: [{ key: '', value: '' }] }]
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
                images: v.images || [],
                attributes: Array.isArray(v.attributes) ? [...v.attributes] :
                    (v.attributes && typeof v.attributes === 'object' ?
                        Object.entries(v.attributes).map(([key, value]) => ({ key, value: String(value) })) :
                        [{ key: '', value: '' }]) // Fallback to one empty attribute row if needed or just empty array
            })) : []
        };

        if (!this.form.variants || this.form.variants.length === 0) {
            this.form.variants = [{ sku: '', price: 0, stock: 0, images: [], attributes: [{ key: '', value: '' }] }];
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
            attributes: [{ key: '', value: '' }]
        });
        console.log('ProductForm: Variant added. New count:', this.form.variants.length);
        this.cdr.detectChanges();
    }

    removeVariant(index: number) {
        if (this.form.variants.length > 1) {
            const variant = this.form.variants[index];
            console.log('ProductForm: Removing variant at index:', index, 'Variant:', variant);
            if (variant._id) {
                if (!this.form.deletedVariantIds) this.form.deletedVariantIds = [];
                this.form.deletedVariantIds.push(variant._id);
            }
            this.form.variants.splice(index, 1);
            this.cdr.detectChanges();
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

    onSave() {
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
            return {
                ...v,
                attributes: attributesObj
            };
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
