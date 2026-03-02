import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, ProductVariant } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface CartItem {
  id?: string; // combination of productId and variantId
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
  promotion?: any;
  addedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  private cartItems = signal<CartItem[]>([]);

  // Public readonly signals
  items = computed(() => this.cartItems());
  totalCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
  totalAmount = computed(() =>
    this.cartItems().reduce((acc, item) => {
      let price = item.variant ? item.variant.price : item.product.price || 0;
      // If there is a promotion applied to this item?
      // Backend stores promotion, but does it return computed price?
      // Usually cart total is computed on backend or we compute here.
      // For now, let's use the base price or if we have promotion info populated, use it.
      // But the user request specifically asked to store promotionId.
      // We will assume simpler logic for now unless backend provides populated promotion.
      return acc + price * item.quantity;
    }, 0),
  );

  constructor() {
    this.loadCart();
  }

  loadCart() {
    this.http.get<any>(`${this.API_URL}/cart`).subscribe({
      next: (cart) => {
        if (cart && cart.items) {
          this.cartItems.set(cart.items);
        } else {
          this.cartItems.set([]);
        }
      },
      error: () => this.cartItems.set([]),
    });
  }

  addToCart(
    product: Product,
    variant: ProductVariant | null,
    quantity: number = 1,
    promotionId?: string,
  ): void {
    const payload = {
      productId: product._id,
      variantId: variant?._id,
      quantity,
      promotionId,
    };

    this.http.post<any>(`${this.API_URL}/cart`, payload).subscribe({
      next: (cart) => {
        if (cart && cart.items) {
          this.cartItems.set(cart.items);
        }
        // Optionally reload to ensure full population
        this.loadCart();
      },
      error: (err) => console.error('Failed to add to cart', err),
    });
  }

  removeFromCart(productId: string, variantId?: string): void {
    // Optimistic update
    const previousItems = this.cartItems();
    const updatedItems = previousItems.filter((item) => {
      const pMatch = item.product._id === productId;
      const vMatch = variantId ? item.variant?._id === variantId : !item.variant;
      return !(pMatch && vMatch);
    });
    this.cartItems.set(updatedItems);

    let url = `${this.API_URL}/cart/${productId}`;
    if (variantId) {
      url += `?variantId=${variantId}`;
    }

    this.http.delete<any>(url).subscribe({
      next: (cart) => {
        if (cart && cart.items) {
          this.cartItems.set(cart.items);
        }
      },
      error: (err) => {
        console.error('Failed to remove from cart', err);
        // Revert on error
        this.cartItems.set(previousItems);
      },
    });
  }

  updateQuantity(productId: string, variantId: string | undefined, quantity: number): void {
    const previousItems = this.cartItems();

    // Optimistic update
    const updatedItems = previousItems.map((item) => {
      const pMatch = item.product._id === productId;
      const vMatch = variantId ? item.variant?._id === variantId : !item.variant;
      if (pMatch && vMatch) {
        return { ...item, quantity };
      }
      return item;
    });
    this.cartItems.set(updatedItems);

    let url = `${this.API_URL}/cart/${productId}`;
    if (variantId) {
      url += `?variantId=${variantId}`;
    }

    this.http.put<any>(url, { quantity }).subscribe({
      next: (cart) => {
        if (cart && cart.items) {
          this.cartItems.set(cart.items);
        }
      },
      error: (err) => {
        console.error('Failed to update quantity', err);
        // Revert
        this.cartItems.set(previousItems);
      },
    });
  }

  clearCart(): void {
    // Optimistic local clear
    this.cartItems.set([]);

    // Backend clear
    this.http.delete<any>(`${this.API_URL}/cart`).subscribe({
      next: (res) => console.log('Cart cleared on backend', res),
      error: (err) => console.error('Failed to clear cart on backend', err),
    });
  }
}
