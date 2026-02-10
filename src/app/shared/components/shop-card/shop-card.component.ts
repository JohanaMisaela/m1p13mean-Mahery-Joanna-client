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
        const user = this.currentUser;
        if (!user || !this.shop) return false;
        return user.favoriteShops?.includes(this.shop._id) || false;
    }

    toggleFavorite(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.favoriteToggle.emit(this.shop);
    }
}
