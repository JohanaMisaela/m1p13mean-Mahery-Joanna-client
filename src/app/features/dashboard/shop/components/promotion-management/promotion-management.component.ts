import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService } from '../../../../../core/services/promotion.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Product } from '../../../../../shared/models/product.model';

interface Promotion {
  _id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: string[];
  shop: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotion-management.component.html',
})
export class PromotionManagementComponent implements OnChanges {
  private promotionService = inject(PromotionService);
  private toastService = inject(ToastService);

  @Input() shopId!: string;
  @Input() products: Product[] = [];
  @Output() refresh = new EventEmitter<void>();

  promotions = signal<Promotion[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  // Form state
  showForm = signal(false);
  editingPromotion: Promotion | null = null;
  formData = signal({
    name: '',
    description: '',
    discountPercentage: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    products: [] as string[],
  });

  // Product selection
  showProductSelector = signal(false);
  selectedProducts = signal<string[]>([]); // Stores variant IDs

  ngOnChanges(changes: SimpleChanges) {
    if (changes['shopId'] && this.shopId) {
      this.loadPromotions();
    }
  }

  toggleProductSelection(product: Product) {
    const variantIds = product.variants?.map((v) => v._id) || [product._id];
    const current = this.selectedProducts();

    const allSelected = variantIds.every((id) => current.includes(id));

    if (allSelected) {
      this.selectedProducts.set(current.filter((id) => !variantIds.includes(id)));
    } else {
      const newSelection = [...current];
      variantIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      this.selectedProducts.set(newSelection);
    }
  }

  toggleVariantSelection(variantId: string) {
    const current = this.selectedProducts();
    if (current.includes(variantId)) {
      this.selectedProducts.set(current.filter((id) => id !== variantId));
    } else {
      this.selectedProducts.set([...current, variantId]);
    }
  }

  isProductSelected(product: Product): boolean {
    const variantIds = product.variants?.map((v) => v._id) || [product._id];
    return variantIds.every((id) => this.selectedProducts().includes(id));
  }

  isProductIndeterminate(product: Product): boolean {
    const variantIds = product.variants?.map((v) => v._id) || [product._id];
    const selectedCount = variantIds.filter((id) => this.selectedProducts().includes(id)).length;
    return selectedCount > 0 && selectedCount < variantIds.length;
  }

  isVariantSelected(variantId: string): boolean {
    return this.selectedProducts().includes(variantId);
  }

  loadPromotions() {
    this.isLoading.set(true);
    this.promotionService.getShopPromotions(this.shopId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res.data || [];
        this.promotions.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreateForm() {
    this.editingPromotion = null;
    this.formData.set({
      name: '',
      description: '',
      discountPercentage: 0,
      startDate: '',
      endDate: '',
      isActive: true,
      products: [],
    });
    this.selectedProducts.set([]);
    this.showForm.set(true);
  }

  openEditForm(promotion: Promotion) {
    this.editingPromotion = promotion;
    this.formData.set({
      name: promotion.name,
      description: promotion.description || '',
      discountPercentage: promotion.discountPercentage,
      startDate: this.formatDateForInput(promotion.startDate),
      endDate: this.formatDateForInput(promotion.endDate),
      isActive: promotion.isActive,
      products: promotion.products || [],
    });
    this.selectedProducts.set(promotion.products || []);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingPromotion = null;
  }

  savePromotion() {
    const data = this.formData();

    // Validation
    if (!data.name || !data.startDate || !data.endDate || data.discountPercentage <= 0) {
      this.toastService.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      this.toastService.warning('La date de fin doit être après la date de début.');
      return;
    }

    this.isSaving.set(true);

    // Convert dates to ISO datetime format
    const startDate = new Date(data.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(data.endDate);
    endDate.setHours(23, 59, 59, 999);

    const payload = {
      ...data,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      products: this.selectedProducts(),
    };

    if (this.editingPromotion) {
      // Update
      this.promotionService.updatePromotion(this.editingPromotion._id, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeForm();
          this.loadPromotions();
          this.refresh.emit();
        },
        error: () => this.isSaving.set(false),
      });
    } else {
      // Create
      this.promotionService.createPromotion(this.shopId, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeForm();
          this.loadPromotions();
          this.refresh.emit();
        },
        error: () => this.isSaving.set(false),
      });
    }
  }

  togglePromotionStatus(promotion: Promotion) {
    this.promotionService
      .updatePromotion(promotion._id, { isActive: !promotion.isActive })
      .subscribe({
        next: () => {
          promotion.isActive = !promotion.isActive;
          this.refresh.emit();
        },
      });
  }

  isStartDateEditable(): boolean {
    if (!this.editingPromotion) return true;
    const startDate = new Date(this.editingPromotion.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate > today;
  }

  getPromotionStatus(promotion: Promotion): 'ongoing' | 'upcoming' | 'expired' {
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (now >= start && now <= end) return 'ongoing';
    if (now < start) return 'upcoming';
    return 'expired';
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  formatDateForDisplay(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getVariantLabel(variant: any): string {
    if (!variant.attributes) return 'Variant sans attributs';
    return Object.values(variant.attributes).join(' - ') || 'Variant sans attributs';
  }

  get Object() {
    return Object;
  }
}
