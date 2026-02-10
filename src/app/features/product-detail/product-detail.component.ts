import { Component, inject, signal, OnInit, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductVariant } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faCartPlus, faStore, faExclamationTriangle, faComment, faUser, faTimes, faHeart, faPlus, faTrash, faCamera, faEdit, faChevronLeft, faChevronRight, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { ProductAttributesComponent } from './components/product-attributes/product-attributes.component';
import { ProductReportComponent } from './components/product-report/product-report.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FontAwesomeModule, ProductReviewsComponent, ProductAttributesComponent, ProductReportComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  product = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  currentUser = this.authService.currentUser;
  currentImageIndex = signal<number>(0);
  showAddedToCart = signal<boolean>(false);

  selectedAttributes = signal<{ [key: string]: string }>({});

  currentVariant = computed(() => {
    const prod = this.product();
    const selected = this.selectedAttributes();

    if (!prod || !prod.variants || prod.variants.length === 0) return null;

    const selectedKeys = Object.keys(selected);
    if (selectedKeys.length === 0) return null;

    // Helper: find value in selected object case-insensitively
    const findValue = (searchKey: string) => {
      const actualKey = Object.keys(selected).find(k => k.toLowerCase() === searchKey.toLowerCase());
      return actualKey ? selected[actualKey] : undefined;
    };

    // Find a variant that matches ALL selected attributes
    const variant = prod.variants.find(v => {
      // 1. Every selected attribute must match this variant
      const matchesSelection = Object.entries(selected).every(([selKey, selValue]) => {
        const variantKey = Object.keys(v.attributes).find(k => k.toLowerCase() === selKey.toLowerCase());
        if (!variantKey) return false;
        return v.attributes[variantKey]?.toString().toLowerCase() === selValue.toString().toLowerCase();
      });

      if (!matchesSelection) return false;

      // 2. Strict matching: Every variant attribute must be present in selection
      // This prevents choosing a "default" variant when only one attribute is picked
      const allAttributesPresent = Object.keys(v.attributes).every(vKey => {
        return !!findValue(vKey);
      });

      return allAttributesPresent;
    }) || null;

    console.log('Current Variant detected:', variant?._id, 'for selection:', selected);
    return variant;
  });

  isSelectionComplete = computed(() => {
    const prod = this.product();
    const selected = this.selectedAttributes();
    if (!prod || !prod.variants || prod.variants.length === 0) return true;

    // Get all required keys from variants
    const requiredKeys = new Set<string>();
    prod.variants.forEach(v => Object.keys(v.attributes).forEach(k => requiredKeys.add(k.toLowerCase())));

    // Check if every required key has a matching key in selected (case-insensitive)
    const selectedKeys = Object.keys(selected).map(k => k.toLowerCase());
    return Array.from(requiredKeys).every(rk => selectedKeys.includes(rk));
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
    next: faChevronRight,
    check: faCheckCircle
  };

  constructor() {
    effect(() => {
      // When variant changes, try to jump to its first image
      const variant = this.currentVariant();
      if (variant && variant.images && variant.images.length > 0) {
        const firstImg = variant.images[0];
        const allImgs = this.allAvailableImages();
        const idx = allImgs.indexOf(firstImg);

        untracked(() => {
          if (idx !== -1) {
            this.currentImageIndex.set(idx);
          }
        });
      }
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

    const newFavoritedBy = isFav
      ? (prod.favoritedBy || []).filter(id => id !== userId)
      : [...(prod.favoritedBy || []), userId];

    const updatedProd = { ...prod, favoritedBy: newFavoritedBy };
    this.product.set(updatedProd);

    this.productService.toggleProductFavorite(prod._id, !isFav).subscribe({
      error: (err) => {
        console.error('Favorite toggle error:', err);
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
        this.selectedAttributes.set({});
        this.currentImageIndex.set(0);

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

  addToCart(): void {
    const prod = this.product();
    if (!prod) return;

    this.cartService.addToCart(prod, this.currentVariant(), 1);
    this.showAddedToCart.set(true);
    setTimeout(() => this.showAddedToCart.set(false), 3000);
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
    const images = this.allAvailableImages();
    if (images.length <= 1) return;
    this.currentImageIndex.update(idx => (idx === 0 ? images.length - 1 : idx - 1));
  }

  nextImage(): void {
    const images = this.allAvailableImages();
    if (images.length <= 1) return;
    this.currentImageIndex.update(idx => (idx === images.length - 1 ? 0 : idx + 1));
  }

  setImageIndex(idx: number): void {
    const allImgs = this.allAvailableImages();
    if (idx < 0 || idx >= allImgs.length) return;
    this.currentImageIndex.set(idx);
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }
}
