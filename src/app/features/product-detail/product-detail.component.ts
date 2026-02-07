import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faCartPlus, faStore, faExclamationTriangle, faComment, faUser, faTimes, faHeart, faPlus, faTrash, faCamera } from '@fortawesome/free-solid-svg-icons';
import { FormArray } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  product = signal<Product | null>(null);
  comments = signal<any[]>([]);
  userRating = signal<number>(0);
  isLoading = signal<boolean>(true);
  currentUser = this.authService.currentUser;
  selectedImages = signal<string[]>([]);

  // Modals
  showReportModal = signal<boolean>(false);

  // Forms
  commentForm: FormGroup;
  reportForm: FormGroup;

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
    camera: faCamera
  };

  constructor() {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      description: ['']
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImages.update(imgs => [...imgs, e.target.result as string]);
        };
        reader.readAsDataURL(files[i]);
      }
    }
    // Clear input
    event.target.value = '';
  }

  removeSelectedImage(index: number): void {
    this.selectedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  isFavorite(): boolean {
    const prod = this.product();
    const user = this.currentUser();
    if (!prod || !user) return false;
    const userId = user._id || user.id;
    return prod.favoritedBy?.includes(userId) || false;
  }

  toggleFavorite(): void {
    if (!this.currentUser()) return;
    const prod = this.product();
    if (prod) {
      const favorite = !this.isFavorite();
      this.productService.toggleProductFavorite(prod._id, favorite).subscribe({
        next: () => {
          this.loadProduct(prod._id, true);
        }
      });
    }
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadAll(productId);
    }
  }

  loadAll(id: string, silent: boolean = false): void {
    if (!silent) this.isLoading.set(true);

    // Load product first, then comments/ratings
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        if (!silent) this.isLoading.set(false);

        // Load additional data
        this.loadComments(id, true); // Load comments silently
        if (this.currentUser()) {
          this.loadUserRating(id, true); // Load user rating silently
        }
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

  loadComments(id: string, silent: boolean = false): void {
    this.productService.getComments(id).subscribe({
      next: (res: any) => this.comments.set(res.data || []),
      error: (err) => console.error('Error loading comments:', err)
    });
  }

  loadUserRating(id: string, silent: boolean = false): void {
    this.productService.getMyRating(id).subscribe({
      next: (res) => {
        console.log('User Rating loaded:', res);
        this.userRating.set(res?.rating || 0);
      },
      // Handle 404/error quietly as user might not have rated yet
      error: () => this.userRating.set(0)
    });
  }

  getStarArray(rating: any): number[] {
    const r = Number(rating) || 0;
    return Array(5).fill(0).map((_, i) => i < Math.round(r) ? 1 : 0);
  }

  getDiscountedPrice(price: number, discountPercentage: number): number {
    return price * (1 - discountPercentage / 100);
  }

  submitRating(rating: number): void {
    if (!this.currentUser()) return;
    const prodId = this.product()?._id;
    if (prodId) {
      // Optimistic update
      this.userRating.set(rating);

      this.productService.rateProduct(prodId, rating).subscribe({
        next: () => {
          // Refresh product and rating silently to ensure consistency
          this.loadProduct(prodId, true);
          this.loadUserRating(prodId, true);
        },
        error: (err) => {
          console.error('Rating error:', err);
          // Revert on error? Or just leave it.
        }
      });
    }
  }

  submitComment(): void {
    if (this.commentForm.invalid || !this.currentUser()) return;

    const prodId = this.product()?._id;
    if (prodId) {
      const payload = {
        ...this.commentForm.value,
        images: this.selectedImages()
      };

      this.productService.addComment(prodId, payload).subscribe({
        next: () => {
          this.commentForm.reset();
          this.selectedImages.set([]);

          // Reload comments to get populated user info
          this.loadComments(prodId, true);
          // Refresh product stats silently
          this.loadProduct(prodId, true);
        },
        error: (err) => console.error('Comment error:', err)
      });
    }
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  openReportModal(): void {
    if (this.currentUser()) {
      this.showReportModal.set(true);
    }
  }

  closeReportModal(): void {
    this.showReportModal.set(false);
    this.reportForm.reset();
  }

  submitReport(): void {
    if (this.reportForm.invalid || !this.currentUser()) return;

    const prodId = this.product()?._id;
    if (prodId) {
      this.productService.reportProduct(prodId, this.reportForm.value).subscribe({
        next: () => {
          alert('Signalement envoyé avec succès');
          this.closeReportModal();
        },
        error: () => alert('Erreur lors de l\'envoi du signalement')
      });
    }
  }
}
