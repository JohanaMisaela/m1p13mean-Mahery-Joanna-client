import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/product.model';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
    private readonly categoryService = inject(CategoryService);

    @Input() editMode = false;
    @Input() initialData: any = null;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    categories = signal<Category[]>([]);
    selectedCategories = signal<Category[]>([]);

    attributeConfigs = signal<{ name: string, values: string[] }[]>([]);

    newImageUrl = '';
    newCategoryName = '';

    formData: any = {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        categories: [] as string[],
        images: [] as string[],
        attributeConfig: {}
    };

    ngOnInit() {
        this.categoryService.getCategories().subscribe((res: any) => {
            const data = Array.isArray(res) ? res : (res.data || []);
            this.categories.set(data);
            this.syncCategories();
        });

        if (this.initialData) {
            this.formData = {
                ...this.initialData,
                images: Array.isArray(this.initialData.images) ? [...this.initialData.images] : []
            };

            if (this.initialData.attributeConfig) {
                const configs = Object.entries(this.initialData.attributeConfig).map(([name, values]: [string, any]) => ({
                    name,
                    values: Array.isArray(values) ? [...values] : []
                }));
                this.attributeConfigs.set(configs.length ? configs : []);
            }

            this.formData.categories = Array.isArray(this.initialData.categories)
                ? this.initialData.categories.map((c: any) => c._id || c)
                : (this.initialData.category ? [this.initialData.category._id || this.initialData.category] : []);

            this.syncCategories();
        }
    }

    private syncCategories() {
        if (this.formData.categories?.length && this.categories().length) {
            const selected = this.categories().filter(c => this.formData.categories.includes(c._id));
            this.selectedCategories.set(selected);
        }
    }

    addAttributeConfig() {
        this.attributeConfigs.update(configs => [...configs, { name: '', values: [] }]);
    }

    removeAttributeConfig(index: number) {
        this.attributeConfigs.update(configs => configs.filter((_, i) => i !== index));
    }

    addAttributeValue(configIndex: number, value: string) {
        if (!value.trim()) return;
        this.attributeConfigs.update(configs => {
            const newConfigs = [...configs];
            if (!newConfigs[configIndex].values.includes(value.trim())) {
                newConfigs[configIndex].values.push(value.trim());
            }
            return newConfigs;
        });
    }

    removeAttributeValue(configIndex: number, valueIndex: number) {
        this.attributeConfigs.update(configs => {
            const newConfigs = [...configs];
            newConfigs[configIndex].values.splice(valueIndex, 1);
            return newConfigs;
        });
    }

    onCategorySelect(event: any) {
        const id = (event.target as HTMLSelectElement).value;
        const found = this.categories().find(c => c._id === id);
        if (found && !this.selectedCategories().some(c => c._id === id)) {
            this.selectedCategories.update(current => [...current, found]);
            this.formData.categories.push(found._id);
        }
    }

    removeCategory(index: number) {
        const cat = this.selectedCategories()[index];
        this.selectedCategories.update(current => current.filter((_, i) => i !== index));
        this.formData.categories = this.formData.categories.filter((id: string) => id !== cat._id);
    }

    createNewCategory() {
        if (!this.newCategoryName.trim()) return;
        this.categoryService.createCategory({ name: this.newCategoryName.trim(), type: 'product' }).subscribe({
            next: (newCat: any) => {
                this.categories.update(cats => [...cats, newCat]);
                this.selectedCategories.update(current => [...current, newCat]);
                this.formData.categories.push(newCat._id);
                this.newCategoryName = '';
            },
            error: () => this.newCategoryName = ''
        });
    }

    addImageByUrl() {
        if (this.newImageUrl.trim()) {
            this.formData.images.push(this.newImageUrl.trim());
            this.newImageUrl = '';
        }
    }

    onFileSelected(event: any) {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach((file: any) => {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.formData.images.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    removeImage(index: number) {
        this.formData.images.splice(index, 1);
    }

    submit() {
        const config: any = {};
        this.attributeConfigs().forEach(attr => {
            if (attr.name.trim() && attr.values.length) {
                config[attr.name.trim()] = attr.values;
            }
        });
        this.formData.attributeConfig = config;

        // Filter categories to only send IDs
        const finalData = { ...this.formData };
        delete finalData.category; // Cleanup old field

        this.save.emit(finalData);
    }
}
