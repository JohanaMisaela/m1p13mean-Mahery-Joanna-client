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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

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
  isLocked?: boolean;
}

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
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

  // Current datetime for min constraints
  minDateTime = '';

  icons = {
    calendar: faCalendarAlt,
    clock: faClock,
  };

  constructor() {
    this.updateMinDateTime();
  }

  updateMinDateTime() {
    const now = new Date();
    this.minDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  }

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
      // Trying to deselect all. Check if any are locked.
      if (this.editingPromotion?.isLocked) {
        const lockedInThisProduct = variantIds.filter((id) =>
          this.editingPromotion!.products.includes(id),
        );
        if (lockedInThisProduct.length > 0) {
          this.toastService.warning(
            'Certains variants de ce produit ne peuvent pas être retirés car la promotion est déjà utilisée.',
          );
          // Only keep the locked ones
          this.selectedProducts.set([
            ...current.filter((id) => !variantIds.includes(id) || lockedInThisProduct.includes(id)),
          ]);
          return;
        }
      }
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
    if (this.editingPromotion?.isLocked && this.editingPromotion.products.includes(variantId)) {
      this.toastService.warning(
        "Vous ne pouvez pas retirer un produit d'une promotion déjà utilisée dans des commandes.",
      );
      return;
    }

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
    this.updateMinDateTime();

    const now = new Date();
    const tonight = new Date();
    tonight.setHours(23, 59, 59, 999);

    this.formData.set({
      name: '',
      description: '',
      discountPercentage: 0,
      startDate: this.formatDateForInput(now.toISOString()),
      endDate: this.formatDateForInput(tonight.toISOString()),
      isActive: true,
      products: [],
    });
    this.selectedProducts.set([]);
    this.showForm.set(true);
  }

  openEditForm(promotion: Promotion) {
    this.editingPromotion = promotion;
    this.updateMinDateTime();
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

    const payload = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
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
    // Pad values for datetime-local (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatDateWithTime(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
