import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-variant-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './variant-form.component.html',
    styleUrl: './variant-form.component.css'
})
export class VariantFormComponent implements OnInit {
    @Input() initialData: any = null;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    attributeInputs = signal<{ key: string, value: string }[]>([{ key: '', value: '' }]);
    newImageUrl = '';

    formData = {
        price: 0,
        stock: 0,
        sku: '',
        attributes: {} as any,
        images: [] as string[]
    };

    ngOnInit() {
        if (this.initialData) {
            this.formData = {
                ...this.initialData,
                images: Array.isArray(this.initialData.images) ? [...this.initialData.images] : []
            };
            if (this.formData.attributes) {
                const attrs = Object.entries(this.formData.attributes).map(([key, value]) => ({ key, value: value as string }));
                this.attributeInputs.set(attrs.length ? attrs : [{ key: '', value: '' }]);
            }
        }
    }

    addAttribute() {
        this.attributeInputs.update(a => [...a, { key: '', value: '' }]);
    }

    removeAttribute(i: number) {
        this.attributeInputs.update(a => {
            const filtered = a.filter((_, idx) => idx !== i);
            return filtered.length ? filtered : [{ key: '', value: '' }];
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
        const attrs: any = {};
        this.attributeInputs().forEach(a => {
            if (a.key.trim()) attrs[a.key.trim()] = a.value.trim();
        });
        this.formData.attributes = attrs;
        this.save.emit(this.formData);
    }
}
