
import { Component, Input, Output, EventEmitter, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar, faComment, faUser, faTimes, faTrash, faCamera, faEdit } from '@fortawesome/free-solid-svg-icons';
import { User } from '../../../../shared/models/user.model';

@Component({
    selector: 'app-product-reviews',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, FontAwesomeModule],
    templateUrl: './product-reviews.component.html',
    styleUrls: ['./product-reviews.component.scss']
})
export class ProductReviewsComponent implements OnInit {
    @Input({ required: true }) productId!: string;
    @Input() currentUser: User | null = null;
    @Output() reviewsUpdated = new EventEmitter<void>();

    private productService = inject(ProductService);
    private fb = inject(FormBuilder);

    comments = signal<any[]>([]);
    userRating = signal<number>(0);

    selectedImages = signal<string[]>([]);
    editSelectedImages = signal<string[]>([]);
    editingCommentId = signal<string | null>(null);

    commentForm: FormGroup;
    editCommentForm: FormGroup;

    icons = {
        star: faStar,
        comment: faComment,
        user: faUser,
        close: faTimes,
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
    }

    ngOnInit(): void {
        if (this.productId) {
            this.loadComments(this.productId);
            if (this.currentUser) {
                this.loadUserRating(this.productId);
            }
        }
    }


    loadComments(id: string): void {
        this.productService.getComments(id).subscribe({
            next: (res: any) => this.comments.set(res.data || []),
            error: (err) => console.error('Error loading comments:', err)
        });
    }

    loadUserRating(id: string): void {
        this.productService.getMyRating(id).subscribe({
            next: (res) => {
                this.userRating.set(res?.rating || 0);
            },
            error: () => this.userRating.set(0)
        });
    }

    getStarArray(rating: any): number[] {
        const r = Number(rating) || 0;
        return Array(5).fill(0).map((_, i) => i < Math.round(r) ? 1 : 0);
    }

    submitRating(rating: number): void {
        if (!this.currentUser || !this.productId) return;

        this.userRating.set(rating);

        this.productService.rateProduct(this.productId, rating).subscribe({
            next: () => {
                this.loadUserRating(this.productId);
                this.reviewsUpdated.emit();
            },
            error: (err) => {
                console.error('Rating error:', err);
            }
        });
    }

    submitComment(): void {
        if (this.commentForm.invalid || !this.currentUser || !this.productId) return;

        const commentData = this.commentForm.value.comment;
        const commentImages = [...this.selectedImages()];

        const tempComment = {
            _id: 'temp-' + Date.now(),
            comment: commentData,
            images: commentImages,
            user: {
                _id: this.currentUser._id || this.currentUser.id,
                id: this.currentUser.id || this.currentUser._id,
                name: this.currentUser.name || 'Moi'
            },
            createdAt: new Date().toISOString()
        };

        const previousComments = this.comments();
        this.comments.set([tempComment, ...previousComments]);

        this.commentForm.reset();
        this.selectedImages.set([]);

        const payload = { comment: commentData, images: commentImages };
        this.productService.addComment(this.productId, payload).subscribe({
            next: () => {
                this.loadComments(this.productId);
                this.reviewsUpdated.emit();
            },
            error: (err) => {
                console.error('Comment error:', err);
                this.comments.set(previousComments);
                alert('Erreur lors de l\'envoi du commentaire. Veuillez réessayer.');
            }
        });
    }

    isCommentOwner(comment: any): boolean {
        if (!this.currentUser || !comment.user) return false;
        const commentUserId = comment.user._id || comment.user.id || comment.user;
        const currentUserId = this.currentUser._id || this.currentUser.id;
        return commentUserId === currentUserId;
    }

    editComment(comment: any): void {
        this.editingCommentId.set(comment._id);
        this.editCommentForm.patchValue({
            comment: comment.comment
        });
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
                this.loadComments(this.productId);
                this.reviewsUpdated.emit();
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
                this.loadComments(this.productId);
                this.reviewsUpdated.emit();
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

    openImage(url: string): void {
        window.open(url, '_blank');
    }
}
