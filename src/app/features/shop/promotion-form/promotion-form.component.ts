import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-promotion-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './promotion-form.component.html',
    styleUrls: []
})
export class PromotionFormModalComponent implements OnInit {
    @Input() initialData: any = null;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    formData = {
        name: '',
        discountPercentage: 10,
        type: 'percentage',
        startDate: '',
        endDate: ''
    };

    ngOnInit() {
        if (this.initialData) {
            this.formData = { ...this.initialData };
        } else {
            // Set default dates
            const now = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(now.getMonth() + 1);
            this.formData.startDate = now.toISOString().split('T')[0];
            this.formData.endDate = nextMonth.toISOString().split('T')[0];
        }
    }

    submit() {
        this.save.emit(this.formData);
    }
}
