import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderResponse } from '../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoppingBag,
  faClock,
  faCheck,
  faTruck,
  faTimes,
  faMapMarkerAlt,
  faChevronRight,
  faBoxOpen
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './orders.component.html',
  styles: [`
    .order-card {
      transition: transform 0.2s ease, shadow 0.2s ease;
    }
    .order-card:hover {
      transform: translateY(-2px);
    }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);

  currentUser = this.authService.currentUser;
  orders = signal<Order[]>([]);
  loading = signal<boolean>(false);

  icons = {
    bag: faShoppingBag,
    clock: faClock,
    check: faCheck,
    truck: faTruck,
    times: faTimes,
    marker: faMapMarkerAlt,
    chevron: faChevronRight,
    empty: faBoxOpen
  };

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getMyOrders({ limit: 50 }).subscribe({
      next: (res: OrderResponse) => {
        this.orders.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.loading.set(false);
      }
    });
  }

  cancelOrder(orderId: string) {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      return;
    }

    this.orderService.updateOrderStatus(orderId, 'CANCELLED').subscribe({
      next: () => {
        // Update local state
        this.orders.update(current =>
          current.map(o => o._id === orderId ? { ...o, status: 'CANCELLED' } : o) as Order[]
        );
        alert("Commande annulée avec succès.");
      },
      error: (err) => {
        console.error('Failed to cancel order', err);
        alert("Erreur lors de l'annulation de la commande.");
      }
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'CONFIRMED': return 'Confirmée';
      case 'SHIPPED': return 'Expédiée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'SHIPPED': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  }

  getAttributesString(attributes: any): string {
    if (!attributes) return '';
    if (Array.isArray(attributes)) {
      return attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ');
    }
    return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
  }
}
