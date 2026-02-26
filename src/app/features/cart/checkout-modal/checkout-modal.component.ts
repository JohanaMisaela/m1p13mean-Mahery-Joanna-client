import { Component, inject, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faPlus, faCheck, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { AddressService } from '../../../core/services/address.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserAddress, CreateAddressDto } from '../../../shared/models/address.model';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './checkout-modal.component.html',
})
export class CheckoutModalComponent implements OnInit {
  private addressService = inject(AddressService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  @Output() close = new EventEmitter<void>();
  @Output() orderSuccess = new EventEmitter<void>();

  currentUser = this.authService.currentUser;
  cartItems = this.cartService.items;

  addresses = signal<UserAddress[]>([]);
  selectedAddressId = signal<string | null>(null);
  showAddressForm = signal<boolean>(false);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  newAddress: CreateAddressDto = {
    street: '',
    city: '',
    zip: '',
    country: 'Madagascar',
    isDefault: false,
  };

  icons = {
    times: faTimes,
    plus: faPlus,
    check: faCheck,
    marker: faMapMarkerAlt,
  };

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses() {
    this.loading.set(true);
    this.addressService.getUserAddresses().subscribe({
      next: (res) => {
        this.addresses.set(res.data);
        // Auto-select default address
        const defaultAddr = res.data.find((a) => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId.set(defaultAddr._id);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load addresses', err);
        this.loading.set(false);
      },
    });
  }

  selectAddress(addressId: string) {
    this.selectedAddressId.set(addressId);
  }

  toggleAddressForm() {
    this.showAddressForm.set(!this.showAddressForm());
  }

  createAddress() {
    if (!this.newAddress.street || !this.newAddress.city || !this.newAddress.zip) {
      this.toastService.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.addressService.createAddress(this.newAddress).subscribe({
      next: (createdAddress) => {
        this.addresses.update((addrs) => [...addrs, createdAddress]);
        this.selectedAddressId.set(createdAddress._id);
        this.showAddressForm.set(false);
        // Reset form
        this.newAddress = {
          street: '',
          city: '',
          zip: '',
          country: 'Madagascar',
          isDefault: false,
        };
      },
      error: (err: any) => {
        console.error('Failed to create address', err);
        this.toastService.error("Erreur lors de la création de l'adresse");
      },
    });
  }

  getCartSummary() {
    const items = this.cartItems();
    let subtotal = 0;
    let savings = 0;

    items.forEach((item) => {
      const basePrice = item.variant ? item.variant.price : item.product.price || 0;
      const quantity = item.quantity;

      if (item.promotion) {
        const discount = item.promotion.discountPercentage || 0;
        const discountAmount = basePrice * (discount / 100);
        savings += discountAmount * quantity;
      }

      subtotal += basePrice * quantity;
    });

    return {
      subtotal,
      savings,
      total: subtotal - savings,
    };
  }

  submitOrder() {
    if (!this.selectedAddressId()) {
      this.toastService.warning('Veuillez sélectionner une adresse de livraison');
      return;
    }

    const items = this.cartItems();
    if (items.length === 0) {
      this.toastService.warning('Votre panier est vide');
      return;
    }

    // Group items by shop
    const itemsByShop = new Map<string, CartItem[]>();
    items.forEach((item) => {
      const shopId = item.product.shop;
      if (!itemsByShop.has(shopId)) {
        itemsByShop.set(shopId, []);
      }
      itemsByShop.get(shopId)!.push(item);
    });

    // For now, create order for the first shop (in a real app, handle multiple shops)
    const [shopId, shopItems] = Array.from(itemsByShop.entries())[0];

    const orderData = {
      shopId,
      items: shopItems.map((item) => ({
        product: item.product._id,
        variant: item.variant?._id,
        quantity: item.quantity,
      })),
      addressId: this.selectedAddressId(),
    };

    this.submitting.set(true);
    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.cartService.clearCart();
        this.orderSuccess.emit();
        this.close.emit();
        this.toastService.success('Commande passée avec succès !');
      },
      error: (err: any) => {
        console.error('Failed to create order', err);
        this.submitting.set(false);
        this.toastService.error(
          'Erreur lors de la création de la commande: ' + (err.error?.message || 'Erreur inconnue'),
        );
      },
    });
  }

  closeModal() {
    this.close.emit();
  }
}
