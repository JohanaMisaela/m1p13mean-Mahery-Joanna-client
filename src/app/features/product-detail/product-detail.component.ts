import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faCartPlus, faStore, faExclamationTriangle, faComment, faUser, faTimes, faHeart, faPlus, faTrash, faCamera, faEdit } from '@fortawesome/free-solid-svg-icons';

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
  editSelectedImages = signal<string[]>([]);
  editingCommentId = signal<string | null>(null);

  // Modals
  showReportModal = signal<boolean>(false);

  // Forms
  commentForm: FormGroup;
  editCommentForm: FormGroup;
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
    camera: faCamera,
    edit: faEdit
  };

  constructor() {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
    });

    this.editCommentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
    });

    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      description: ['']
    });
  }
  isCommentOwner(comment: any): boolean {
    const user = this.currentUser();
    if (!user || !comment.user) return false;
    const commentUserId = comment.user._id || comment.user.id || comment.user;
    const currentUserId = user._id || user.id;
    return commentUserId === currentUserId;
  }

  editComment(comment: any): void {
    this.editingCommentId.set(comment._id);
    this.editCommentForm.patchValue({
      comment: comment.comment
    });
    // Load existing images into edit buffer
    this.editSelectedImages.set(comment.images || []);
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editCommentForm.reset();
    this.editSelectedImages.set([]);
  }

  submitUpdate(commentId: string): void {
    if (this.editCommentForm.invalid) return;

    const previousComments = this.comments();
    const updatedText = this.editCommentForm.value.comment;
    const updatedImages = this.editSelectedImages();

    // Optimistic Update
    this.comments.set(previousComments.map(c =>
      c._id === commentId
        ? { ...c, comment: updatedText, images: updatedImages }
        : c
    ));

    const updatedData = {
      comment: updatedText,
      images: updatedImages
    };

    this.editingCommentId.set(null);
    this.editSelectedImages.set([]);

    this.productService.updateComment(commentId, updatedData).subscribe({
      next: () => {
        const prodId = this.product()?._id;
        if (prodId) {
          this.loadComments(prodId, true);
          this.loadProduct(prodId, true);
        }
      },
      error: (err) => {
        console.error('Update comment error:', err);
        this.comments.set(previousComments);
        alert('Erreur lors de la modification');
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;

    const previousComments = this.comments();
    this.comments.set(previousComments.filter(c => c._id !== commentId));

    this.productService.deleteComment(commentId).subscribe({
      next: () => {
        const prodId = this.product()?._id;
        if (prodId) {
          this.loadProduct(prodId, true);
          // Optionally reload comments to ensure sync
          this.loadComments(prodId, true);
        }
      },
      error: (err) => {
        console.error('Delete comment error:', err);
        this.comments.set(previousComments);
        alert('Erreur lors de la suppression');
      }
    });
  }

  onFileSelected(event: any, target: 'main' | 'edit' = 'main'): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const result = e.target.result as string;
          if (target === 'main') {
            this.selectedImages.update(imgs => [...imgs, result]);
          } else {
            this.editSelectedImages.update(imgs => [...imgs, result]);
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
    event.target.value = '';
  }

  removeSelectedImage(index: number, target: 'main' | 'edit' = 'main'): void {
    if (target === 'main') {
      this.selectedImages.update(imgs => imgs.filter((_, i) => i !== index));
    } else {
      this.editSelectedImages.update(imgs => imgs.filter((_, i) => i !== index));
    }
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
        if (!silent) this.isLoading.set(false);

        this.loadComments(id, true);
        if (this.currentUser()) {
          this.loadUserRating(id, true);
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
      this.userRating.set(rating);

      this.productService.rateProduct(prodId, rating).subscribe({
        next: () => {
          this.loadProduct(prodId, true);
          this.loadUserRating(prodId, true);
        },
        error: (err) => {
          console.error('Rating error:', err);
        }
      });
    }
  }

  submitComment(): void {
    const user = this.currentUser();
    const prodId = this.product()?._id;
    if (this.commentForm.invalid || !user || !prodId) return;

    const commentData = this.commentForm.value.comment;
    const commentImages = [...this.selectedImages()];

    const tempComment = {
      _id: 'temp-' + Date.now(),
      comment: commentData,
      images: commentImages,
      user: {
        _id: user._id || user.id,
        id: user.id || user._id,
        name: user.name || 'Moi'
      },
      createdAt: new Date().toISOString()
    };

    const previousComments = this.comments();
    this.comments.set([tempComment, ...previousComments]);

    this.commentForm.reset();
    this.selectedImages.set([]);

    const payload = { comment: commentData, images: commentImages };
    this.productService.addComment(prodId, payload).subscribe({
      next: () => {
        this.loadComments(prodId, true);
        this.loadProduct(prodId, true);
      },
      error: (err) => {
        console.error('Comment error:', err);
        this.comments.set(previousComments);
        alert('Erreur lors de l\'envoi du commentaire. Veuillez réessayer.');
      }
    });
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
