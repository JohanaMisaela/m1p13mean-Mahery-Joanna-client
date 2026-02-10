import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart, faStore, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Shop } from '../../models/product.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-shop-card',
    standalone: true,
    imports: [CommonModule, RouterLink, FontAwesomeModule],
    templateUrl: './shop-card.component.html',
    styleUrl: './shop-card.component.css'
})
export class ShopCardComponent {
    @Input({ required: true }) shop!: Shop;
    @Input() showFavoriteButton: boolean = true;
    @Input() isFavorite: boolean = false; // Override for favorites page
    @Output() favoriteToggle = new EventEmitter<Shop>();

    private authService = inject(AuthService);

    icons = {
        heart: faHeart,
        shop: faStore,
        next: faChevronRight
    };

    get currentUser() {
        return this.authService.currentUser();
    }

    isFavorited(): boolean {
        // If isFavorite is explicitly set, use that
        if (this.isFavorite) {
            console.log('Shop card - isFavorite input is true for:', this.shop.name);
            return true;
        }

        const user = this.currentUser;
        if (!user || !this.shop || !this.shop.favoritedBy) {
            console.log('Shop card - No user, shop, or favoritedBy:', {
                user: !!user,
                shop: !!this.shop,
                favoritedBy: this.shop?.favoritedBy
            });
            return false;
        }

        const userId = user._id || user.id;
        const result = this.shop.favoritedBy.some((fav: any) => {
            const favId = typeof fav === 'string' ? fav : (fav._id || fav.id);
            return favId === userId;
        });

        console.log('Shop card - Checking favoritedBy:', {
            shopName: this.shop.name,
            shopId: this.shop._id,
            userId: userId,
            favoritedBy: this.shop.favoritedBy,
            isFavorited: result
        });
        return result;
    }

    toggleFavorite(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.favoriteToggle.emit(this.shop);
    }
}
