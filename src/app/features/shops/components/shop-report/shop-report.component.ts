import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShopService } from '../../../../core/services/shop.service';
import { User } from '../../../../shared/models/user.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-shop-report',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
    templateUrl: './shop-report.component.html'
})
export class ShopReportComponent {
    @Input({ required: true }) shopId!: string;
    @Input() currentUser: User | null = null;

    private shopService = inject(ShopService);
    private fb = inject(FormBuilder);

    showReportModal = signal<boolean>(false);
    reportForm: FormGroup;

    icons = {
        report: faExclamationTriangle
    };

    constructor() {
        this.reportForm = this.fb.group({
            reason: ['', Validators.required],
            description: ['']
        });
    }

    openReportModal(): void {
        if (this.currentUser) {
            this.showReportModal.set(true);
        } else {
            alert('Connectez-vous pour signaler cette boutique');
        }
    }

    closeReportModal(): void {
        this.showReportModal.set(false);
        this.reportForm.reset();
    }

    submitReport(): void {
        if (this.reportForm.invalid || !this.currentUser || !this.shopId) return;

        this.shopService.reportShop(this.shopId, this.reportForm.value).subscribe({
            next: () => {
                alert('Signalement envoyé avec succès');
                this.closeReportModal();
            },
            error: (err) => {
                console.error('Report error:', err);
                alert('Erreur lors de l\'envoi du signalement');
            }
        });
    }
}
