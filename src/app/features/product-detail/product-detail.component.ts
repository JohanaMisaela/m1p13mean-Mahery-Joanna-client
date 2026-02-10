import { Component, inject, signal, OnInit, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, ProductVariant } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faCartPlus, faStore, faExclamationTriangle, faComment, faUser, faTimes, faHeart, faPlus, faTrash, faCamera, faEdit, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { ProductAttributesComponent } from './components/product-attributes/product-attributes.component';
import { ProductReportComponent } from './components/product-report/product-report.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule, ProductReviewsComponent, ProductAttributesComponent, ProductReportComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  // fb is likely not needed anymore if only used for reportForm (unless used for something else? Checked, it was used for comment editing but that's gone too. Let's keep it if I missed something or remove if unused.)
  // Wait, I see no other form groups in the truncated view. But let's check carefully.
  // The provided view earlier showed `reportForm` initialization in constructor. `commentForm` etc were already removed.
  // So `fb` might be unused now. I'll remove it to be clean.

  product = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  currentUser = this.authService.currentUser;
  currentImageIndex = signal<number>(0);

  // Variant Selection
  selectedAttributes = signal<{ [key: string]: string }>({});

  currentVariant = computed(() => {
    const prod = this.product();
    const selected = this.selectedAttributes();

    if (!prod || !prod.variants || prod.variants.length === 0) return null;

    const selectedKeys = Object.keys(selected);
    if (selectedKeys.length === 0) return null;

    // Find a variant where ALL of its attributes match our current selection
    // We don't require selecting all possible attributes - just that what we selected matches
    const variant = prod.variants.find(v => {
      return Object.entries(v.attributes).every(([key, value]) => {
        // If we haven't selected this attribute yet, it's not a mismatch
        if (!selected[key]) return true;

        const val1 = value?.toString().toLowerCase();
        const val2 = selected[key]?.toString().toLowerCase();
        return val1 === val2;
      });
    }) || null;

    console.log('Current Variant detected:', variant?._id, 'for selection:', selected);
    return variant;
  });

  effectivePrice = computed(() => {
    const variant = this.currentVariant();
    if (variant) return variant.price;
    return this.product()?.price || 0;
  });

  effectiveStock = computed(() => {
    const variant = this.currentVariant();
    if (variant) return variant.stock;
    return this.product()?.stock || 0;
  });

  effectiveImages = computed(() => {
    const variant = this.currentVariant();
    if (variant && variant.images && variant.images.length > 0) {
      return variant.images;
    }
    return this.product()?.images || [];
  });

  allAvailableImages = computed(() => {
    const prod = this.product();
    if (!prod) return [];

    const baseImages = prod.images || [];
    const variantImages = (prod.variants || []).flatMap(v => v.images || []);

    // Unique URLs
    return Array.from(new Set([...baseImages, ...variantImages]));
  });

  imageToVariantMap = computed(() => {
    const prod = this.product();
    const map = new Map<string, ProductVariant>();
    if (!prod || !prod.variants) return map;

    prod.variants.forEach(v => {
      if (v.images) {
        v.images.forEach(img => map.set(img, v));
      }
    });
    return map;
  });

  icons = {
    star: faStar,
    cart: faCartPlus,
    shop: faStore,
    report: faExclamationTriangle,
    comment: faComment,
    user: faUser,
    close: faTimes,
    heart: faHeart,
    plus: faPlus,
    trash: faTrash,
    camera: faCamera,
    edit: faEdit,
    prev: faChevronLeft,
    next: faChevronRight
  };

  constructor() {
    effect(() => {
      // Re-initialize image index when variant changes to ensure valid view
      this.currentVariant();
      untracked(() => {
        this.currentImageIndex.set(0);
      });
    });
  }

  isFavorite(): boolean {
    const prod = this.product();
    const user = this.currentUser();
    if (!prod || !user) return false;
    const userId = user._id || user.id;
    return prod.favoritedBy?.includes(userId) || false;
  }

  toggleFavorite(): void {
    const user = this.currentUser();
    const prod = this.product();
    if (!user || !prod) return;

    const userId = user._id || user.id;
    const isFav = this.isFavorite();

    // Optimistic Update
    const newFavoritedBy = isFav
      ? (prod.favoritedBy || []).filter(id => id !== userId)
      : [...(prod.favoritedBy || []), userId];

    const updatedProd = { ...prod, favoritedBy: newFavoritedBy };
    this.product.set(updatedProd);

    // Background API call
    this.productService.toggleProductFavorite(prod._id, !isFav).subscribe({
      error: (err) => {
        console.error('Favorite toggle error:', err);
        // Revert on error
        this.product.set(prod);
      }
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadAll(productId);
    }
  }

  loadAll(id: string, silent: boolean = false): void {
    if (!silent) this.isLoading.set(true);

    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        // Default to empty selection to show base product price/stock initially
        this.selectedAttributes.set({});

        if (!silent) this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadProduct(id: string, silent: boolean = false): void {
    if (!silent) this.isLoading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        if (!silent) this.isLoading.set(false);
      },
      error: () => {
        if (!silent) this.isLoading.set(false);
      }
    });
  }

  onReviewsUpdated(): void {
    const prod = this.product();
    if (prod) {
      this.loadProduct(prod._id, true);
    }
  }

  onAttributesUpdated(newAttributes: { [key: string]: string }): void {
    this.selectedAttributes.set(newAttributes);
  }

  getStarArray(rating: any): number[] {
    const r = Number(rating) || 0;
    return Array(5).fill(0).map((_, i) => i < Math.round(r) ? 1 : 0);
  }

  getDiscountedPrice(price: number, discountPercentage: number): number {
    return price * (1 - discountPercentage / 100);
  }

  prevImage(): void {
    const images = this.effectiveImages();
    if (images.length <= 1) return;
    this.currentImageIndex.update(idx => (idx === 0 ? images.length - 1 : idx - 1));
  }

  nextImage(): void {
    const images = this.effectiveImages();
    if (images.length <= 1) return;
    this.currentImageIndex.update(idx => (idx === images.length - 1 ? 0 : idx + 1));
  }

  setImageIndex(idx: number): void {
    const allImgs = this.allAvailableImages();
    if (idx < 0 || idx >= allImgs.length) return;

    const clickedImageUrl = allImgs[idx];

    // Check if the clicked image is in the current effective images
    const effIdx = this.effectiveImages().indexOf(clickedImageUrl);
    if (effIdx !== -1) {
      // Image is in current set, just navigate to it
      this.currentImageIndex.set(effIdx);
    } else {
      // Image is not in current effective images
      // Check if it belongs to a variant or base product
      const variant = this.imageToVariantMap().get(clickedImageUrl);

      if (variant) {
        // It's a variant image - select that variant's attributes to show its images
        this.selectedAttributes.set({ ...variant.attributes });
        // The effect will reset currentImageIndex to 0
      } else {
        // It's a base product image - clear variant selection to show base images
        this.selectedAttributes.set({});
        // Find the index in base product images
        const baseImages = this.product()?.images || [];
        const baseIdx = baseImages.indexOf(clickedImageUrl);
        if (baseIdx !== -1) {
          this.currentImageIndex.set(baseIdx);
        }
      }
    }
  }



  openImage(url: string): void {
    window.open(url, '_blank');
  }
}
