
import { Injectable, signal, computed } from '@angular/core';
import { Product, ProductVariant } from '../../shared/models/product.model';

export interface CartItem {
    id: string; // combination of productId and variantId
    product: Product;
    variant: ProductVariant | null;
    quantity: number;
    addedAt: Date;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems = signal<CartItem[]>(this.loadCart());

    // Public readonly signals
    items = computed(() => this.cartItems());
    totalCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
    totalAmount = computed(() => this.cartItems().reduce((acc, item) => {
        const price = item.variant ? item.variant.price : (item.product.price || 0);
        return acc + (price * item.quantity);
    }, 0));

    constructor() {
        // Keep localStorage in sync
        // This is a simple effect-like behavior
    }

    addToCart(product: Product, variant: ProductVariant | null, quantity: number = 1): void {
        const items = [...this.cartItems()];
        const itemId = variant ? `${product._id}_${variant._id}` : product._id;

        const existingIndex = items.findIndex(item => item.id === itemId);

        if (existingIndex !== -1) {
            items[existingIndex] = {
                ...items[existingIndex],
                quantity: items[existingIndex].quantity + quantity
            };
        } else {
            items.push({
                id: itemId,
                product,
                variant,
                quantity,
                addedAt: new Date()
            });
        }

        this.cartItems.set(items);
        this.saveCart(items);
    }

    removeFromCart(itemId: string): void {
        const filtered = this.cartItems().filter(item => item.id !== itemId);
        this.cartItems.set(filtered);
        this.saveCart(filtered);
    }

    updateQuantity(itemId: string, quantity: number): void {
        if (quantity <= 0) {
            this.removeFromCart(itemId);
            return;
        }

        const items = [...this.cartItems()];
        const index = items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            items[index] = { ...items[index], quantity };
            this.cartItems.set(items);
            this.saveCart(items);
        }
    }

    clearCart(): void {
        this.cartItems.set([]);
        this.saveCart([]);
    }

    private loadCart(): CartItem[] {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    private saveCart(items: CartItem[]): void {
        localStorage.setItem('cart', JSON.stringify(items));
    }
}
