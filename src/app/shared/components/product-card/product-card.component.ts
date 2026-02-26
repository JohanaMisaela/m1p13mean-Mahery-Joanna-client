import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCartPlus,
  faStar,
  faStore,
  faHeart,
  faShoppingBag,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private authService = inject(AuthService);
  private productService = inject(ProductService);

  @Input({ required: true }) product!: Product;

  currentUser = this.authService.currentUser;

  protected icons = {
    cart: faCartPlus,
    star: faStar,
    shop: faStore,
    heart: faHeart,
    heartRegular: faHeartRegular,
    bag: faShoppingBag,
  };

  getStarArray(rating: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.round(rating) ? 1 : 0));
  }

  getDiscountedPrice(price: number, discountPercentage: number): number {
    return price * (1 - discountPercentage / 100);
  }

  isFavorite(): boolean {
    const user = this.currentUser();
    if (!user || !this.product) return false;
    const userId = user._id || user.id;
    return this.product.favoritedBy?.includes(userId) || false;
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    const user = this.currentUser();
    if (!user || !this.product) return;

    const userId = user._id || user.id;
    const isFav = this.isFavorite();

    const newFavoritedBy = isFav
      ? (this.product.favoritedBy || []).filter((id) => id !== userId)
      : [...(this.product.favoritedBy || []), userId];

    const originalProduct = { ...this.product };
    this.product = { ...this.product, favoritedBy: newFavoritedBy };

    const productId = this.product._id;
    if (!productId) return;

    this.productService.toggleProductFavorite(productId, !isFav).subscribe({
      error: () => (this.product = originalProduct),
    });
  }
}
