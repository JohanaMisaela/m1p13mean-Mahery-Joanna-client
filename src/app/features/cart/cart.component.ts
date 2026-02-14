import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faMinus, faPlus, faArrowRight, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, EmptyStateComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  cartService = inject(CartService);

  cartItems = this.cartService.items;

  // Calculate subtotal, discount, and total
  cartSummary = computed(() => {
    const items = this.cartItems();
    let subtotal = 0;
    let savings = 0;

    items.forEach(item => {
      const basePrice = item.variant ? item.variant.price : (item.product.price || 0);
      const quantity = item.quantity;

      let itemPrice = basePrice;
      if (item.promotion) {
        const discount = item.promotion.discountPercentage || 0;
        // Validate promotion active? The backend should enable/disable or we check dates?
        // Assuming if it's in the cart populated, we respect it or checking dates:
        // For now, simple logic:
        const discountAmount = basePrice * (discount / 100);
        savings += discountAmount * quantity;
      }

      subtotal += basePrice * quantity;
    });

    return {
      subtotal,
      savings,
      total: subtotal - savings
    };
  });

  icons = {
    trash: faTrash,
    minus: faMinus,
    plus: faPlus,
    arrowRight: faArrowRight,
    bag: faShoppingBag
  };

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.product._id, item.variant?._id, newQuantity);
    }
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.product._id, item.variant?._id);
  }
}
