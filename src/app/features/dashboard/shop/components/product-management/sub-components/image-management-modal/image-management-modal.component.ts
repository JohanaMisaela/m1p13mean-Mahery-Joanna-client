import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-image-management-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './image-management-modal.component.html',
    styleUrl: './image-management-modal.component.scss'
})
export class ImageManagementModalComponent {
    @Input() variant: any;
    @Output() close = new EventEmitter<void>();

    imageToAdd = '';

    addImageUrl() {
        if (this.imageToAdd.trim() && this.variant) {
            if (!this.variant.images) this.variant.images = [];
            this.variant.images.push(this.imageToAdd.trim());
            this.imageToAdd = '';
        }
    }

    removeImage(index: number) {
        if (this.variant && this.variant.images) {
            this.variant.images.splice(index, 1);
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.convertFileToBase64(file).then(base64 => {
                if (!this.variant.images) this.variant.images = [];
                this.variant.images.push(base64);
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
