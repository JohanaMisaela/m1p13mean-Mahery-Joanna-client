import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
  effect,
  untracked,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { PromotionService } from '../../core/services/promotion.service';
import { Product, ProductVariant } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faStar,
  faCartPlus,
  faStore,
  faExclamationTriangle,
  faComment,
  faUser,
  faTimes,
  faHeart,
  faPlus,
  faTrash,
  faCamera,
  faEdit,
  faChevronLeft,
  faChevronRight,
  faCheckCircle,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { ProductReviewsComponent } from './components/product-reviews/product-reviews.component';
import { ProductAttributesComponent } from './components/product-attributes/product-attributes.component';
import { ProductReportComponent } from './components/product-report/product-report.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    ProductReviewsComponent,
    ProductAttributesComponent,
    ProductReportComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private promotionService = inject(PromotionService);

  product = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  currentUser = this.authService.currentUser;
  currentImageIndex = signal<number>(0);
  showAddedToCart = signal<boolean>(false);
  promotions = signal<any[]>([]);
  countdownValue = signal<string | null>(null);
  private countdownInterval: any;

  selectedAttributes = signal<{ [key: string]: string }>({});

  currentVariant = computed(() => {
    const prod = this.product();
    const selected = this.selectedAttributes();

    if (!prod || !prod.variants || prod.variants.length === 0) return null;

    const selectedKeys = Object.keys(selected);
    if (selectedKeys.length === 0) return null;

    const findValue = (searchKey: string) => {
      const actualKey = Object.keys(selected).find(
        (k) => k.toLowerCase() === searchKey.toLowerCase(),
      );
      return actualKey ? selected[actualKey] : undefined;
    };

    const variant =
      prod.variants.find((v) => {
        const matchesSelection = Object.entries(selected).every(([selKey, selValue]) => {
          const variantKey = Object.keys(v.attributes).find(
            (k) => k.toLowerCase() === selKey.toLowerCase(),
          );
          if (!variantKey) return false;
          return (
            v.attributes[variantKey]?.toString().toLowerCase() === selValue.toString().toLowerCase()
          );
        });

        if (!matchesSelection) return false;

        const allAttributesPresent = Object.keys(v.attributes).every((vKey) => {
          return !!findValue(vKey);
        });

        return allAttributesPresent;
      }) || null;
    return variant;
  });

  currentPromotion = computed(() => {
    const variant = this.currentVariant();
    const prod = this.product();
    const allPromotions = this.promotions();

    if (!prod || allPromotions.length === 0) return null;

    // Check for variant specific promotion first
    if (variant) {
      const variantPromo = allPromotions.find((p) => p.products?.includes(variant._id));
      if (variantPromo) return variantPromo;
    }

    // Check for product level promotion (if product ID is in promotion)
    const productPromo = allPromotions.find((p) => p.products?.includes(prod._id));
    if (productPromo) return productPromo;

    return null; // No promotion found
  });

  isSelectionComplete = computed(() => {
    const prod = this.product();
    const selected = this.selectedAttributes();
    if (!prod || !prod.variants || prod.variants.length === 0) return true;

    const requiredKeys = new Set<string>();
    prod.variants.forEach((v) =>
      Object.keys(v.attributes).forEach((k) => requiredKeys.add(k.toLowerCase())),
    );

    const selectedKeys = Object.keys(selected).map((k) => k.toLowerCase());
    return Array.from(requiredKeys).every((rk) => selectedKeys.includes(rk));
  });

  effectivePrice = computed(() => {
    const variant = this.currentVariant();
    const promo = this.currentPromotion();
    let price = this.product()?.price || 0;

    if (variant) {
      price = variant.price;
    }

    if (promo) {
      return price * (1 - promo.discountPercentage / 100);
    }

    return price;
  });

  originalPrice = computed(() => {
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
    const variantImages = (prod.variants || [])
      .filter((v) => v.isActive !== false)
      .flatMap((v) => v.images || []);

    return Array.from(new Set([...baseImages, ...variantImages]));
  });

  // Main horizontal thumbnails: product base images + first image of each variant
  filteredThumbnails = computed(() => {
    const prod = this.product();
    if (!prod) return [];

    const baseImages = prod.images || [];
    const variantFirstImages = (prod.variants || [])
      .filter((v) => v.isActive !== false)
      .map((v) => v.images?.[0])
      .filter((img) => !!img);

    // Filter out duplicates (variant images that might also be in base images)
    return Array.from(new Set([...baseImages, ...variantFirstImages]));
  });

  // Vertical side gallery: additional images for the selected variant
  // Only shown when the selected image belongs to a variant and has more than 1 image
  sideGalleryImages = computed(() => {
    const prod = this.product();
    const currentImg = this.allAvailableImages()[this.currentImageIndex()];
    if (!prod || !currentImg) return [];

    const variant = this.imageToVariantMap().get(currentImg);
    if (!variant || !variant.images || variant.images.length <= 1) return [];

    // Return all images of this variant
    return variant.images;
  });

  imageToVariantMap = computed(() => {
    const prod = this.product();
    const map = new Map<string, ProductVariant>();
    if (!prod || !prod.variants) return map;

    prod.variants
      .filter((v) => v.isActive !== false)
      .forEach((v) => {
        if (v.images) {
          v.images.forEach((img) => map.set(img, v));
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
    check: faCheckCircle,
    stopwatch: faStopwatch,
  };

  constructor() {
    afterNextRender(() => {
      const productId = this.route.snapshot.paramMap.get('id');
      if (productId) {
        this.loadAll(productId);
      }
      this.startCountdown();
    });

    effect(() => {
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
      ? (prod.favoritedBy || []).filter((id) => id !== userId)
      : [...(prod.favoritedBy || []), userId];

    const updatedProd = { ...prod, favoritedBy: newFavoritedBy };
    this.product.set(updatedProd);

    this.productService.toggleProductFavorite(prod._id, !isFav).subscribe({
      error: () => this.product.set(prod),
    });
  }

  ngOnInit(): void {}

  loadAll(id: string, silent: boolean = false): void {
    if (!silent) this.isLoading.set(true);

    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);

        // Pre-select first ACTIVE variant attributes if they exist
        const firstActiveVariant = product.variants?.find((v) => v.isActive !== false);
        if (firstActiveVariant) {
          this.selectedAttributes.set({ ...firstActiveVariant.attributes });
        } else {
          this.selectedAttributes.set({});
        }

        if (product.shop) {
          const shopId = typeof product.shop === 'string' ? product.shop : product.shop._id;
          console.log('Product loaded, loading promotions for shop:', shopId);
          this.loadPromotions(shopId);
        } else {
          console.warn('Product loaded but no shop information found:', product);
        }

        this.currentImageIndex.set(0);

        if (!silent) this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadProduct(id: string, silent: boolean = false): void {
    if (!silent) this.isLoading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        if (product.shop) {
          this.loadPromotions(product.shop._id || product.shop);
        }
        if (!silent) this.isLoading.set(false);
      },
      error: () => {
        if (!silent) this.isLoading.set(false);
      },
    });
  }

  loadPromotions(shopId: string) {
    console.log('loadPromotions called with shopId:', shopId);
    if (!shopId) return;
    this.promotionService.getShopPromotions(shopId).subscribe({
      next: (res: any) => {
        console.log('Promotions loaded for shop', shopId, res);
        const data = Array.isArray(res) ? res : res.data || [];
        const activePromotions = data.filter((p: any) => {
          const now = new Date();
          const start = new Date(p.startDate);
          const end = new Date(p.endDate);
          return p.isActive && now >= start && now <= end;
        });
        console.log('Active promotions filtered:', activePromotions);
        this.promotions.set(activePromotions);
      },
      error: (err) => {
        console.error('Error loading promotions:', err);
        this.promotions.set([]);
      },
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

    const promotion = this.currentPromotion();
    const promotionId = promotion?._id;

    this.cartService.addToCart(prod, this.currentVariant(), 1, promotionId);
    this.showAddedToCart.set(true);
    setTimeout(() => this.showAddedToCart.set(false), 3000);
  }

  onAttributesUpdated(newAttributes: { [key: string]: string }): void {
    this.selectedAttributes.set(newAttributes);
  }

  getStarArray(rating: any): number[] {
    const r = Number(rating) || 0;
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.round(r) ? 1 : 0));
  }

  getDiscountedPrice(price: number, discountPercentage: number): number {
    return price * (1 - discountPercentage / 100);
  }

  prevImage(): void {
    const images = this.allAvailableImages();
    if (images.length <= 1) return;
    this.currentImageIndex.update((idx) => (idx === 0 ? images.length - 1 : idx - 1));
  }

  nextImage(): void {
    const images = this.allAvailableImages();
    if (images.length <= 1) return;
    this.currentImageIndex.update((idx) => (idx === images.length - 1 ? 0 : idx + 1));
  }

  setImageIndex(idx: number): void {
    const allImgs = this.allAvailableImages();
    if (idx < 0 || idx >= allImgs.length) return;
    this.currentImageIndex.set(idx);
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      const promo = this.currentPromotion();
      if (!promo) {
        this.countdownValue.set(null);
        return;
      }

      const now = new Date();
      const end = new Date(promo.endDate);
      const diff = end.getTime() - now.getTime();

      // Check if ends "today" (less than 24h) and still active
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        this.countdownValue.set(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        );
      } else {
        this.countdownValue.set(null);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
