import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { User } from '../../../../shared/models/user.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import {
  AppSelectComponent,
  SelectOption,
} from '../../../../shared/components/app-select/app-select.component';

@Component({
  selector: 'app-product-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, AppSelectComponent],
  templateUrl: './product-report.component.html',
  styleUrls: ['./product-report.component.scss'],
})
export class ProductReportComponent {
  @Input({ required: true }) productId!: string;
  @Input() currentUser: User | null = null;

  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  showReportModal = signal<boolean>(false);
  reportForm: FormGroup;

  icons = {
    report: faExclamationTriangle,
  };

  reasonOptions: SelectOption[] = [
    { label: 'Sélectionnez une raison', value: '' },
    { label: 'Arnaque', value: 'scam' },
    { label: 'Informations incorrectes', value: 'wrong_info' },
    { label: 'Produit interdit', value: 'prohibited' },
    { label: 'Autre', value: 'other' },
  ];

  constructor() {
    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      description: [''],
    });
  }

  openReportModal(): void {
    if (this.currentUser) {
      this.showReportModal.set(true);
    }
  }

  closeReportModal(): void {
    this.showReportModal.set(false);
    this.reportForm.reset();
  }

  submitReport(): void {
    if (this.reportForm.invalid || !this.currentUser || !this.productId) return;

    this.productService.reportProduct(this.productId, this.reportForm.value).subscribe({
      next: () => {
        this.toastService.success('Signalement envoyé avec succès');
        this.closeReportModal();
      },
      error: () => this.toastService.error("Erreur lors de l'envoi du signalement"),
    });
  }
}
