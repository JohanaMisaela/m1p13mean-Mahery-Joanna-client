import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
        if (this.isEdit && this.product) {
            this.initEditForm();
        } else {
            this.initAddForm();
        }
    }

    initAddForm() {
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
        this.form = {
            ...p,
            categories: p.categories?.map((c: any) => typeof c === 'string' ? c : c._id) || (p.category?._id ? [p.category._id] : []),
            tags: p.tags ? p.tags.join(', ') : '',
            variants: p.variants ? p.variants.map((v: any) => ({
                ...v,
                images: v.images || [],
                attributes: Array.isArray(v.attributes) ? [...v.attributes] :
                    (v.attributes ? Object.entries(v.attributes).map(([key, value]) => ({ key, value })) : [])
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
        return this.form.categories && this.form.categories.includes(categoryId);
    }

    getCategoryName(id: string): string {
        const cat = this.categories.find(c => c._id === id);
        return cat ? cat.name : id;
    }

    onCreateCategory() {
        if (this.newCategoryName.trim()) {
            this.createCategory.emit(this.newCategoryName);
            this.newCategoryName = '';
            this.showNewCategoryInput = false;
        }
    }

    addVariant() {
        this.form.variants.push({
            sku: '',
            price: 0,
            stock: 0,
            images: [],
            attributes: [{ key: '', value: '' }]
        });
    }

    removeVariant(index: number) {
        if (this.form.variants.length > 1) {
            this.form.variants.splice(index, 1);
        }
    }

    addAttribute(variantIndex: number) {
        this.form.variants[variantIndex].attributes.push({ key: '', value: '' });
    }

    removeAttribute(variantIndex: number, attrIndex: number) {
        this.form.variants[variantIndex].attributes.splice(attrIndex, 1);
    }

    onSave() {
        // Transform tags
        const tagsArray = typeof this.form.tags === 'string'
            ? this.form.tags.split(',').map((t: string) => t.trim()).filter((t: string) => !!t)
            : this.form.tags;

        if (this.isEdit) {
            // For Edit Mode: Emit the full form object which contains _id and variants
            const payload = {
                ...this.form,
                tags: tagsArray
            };
            this.save.emit(payload);
        } else {
            // For Add Mode: Emit the { product, variants } structure expected by ShopManagementComponent
            const payload = {
                product: {
                    ...this.form,
                    tags: tagsArray
                },
                variants: this.form.variants
            };
            this.save.emit(payload);
        }
    }
}
