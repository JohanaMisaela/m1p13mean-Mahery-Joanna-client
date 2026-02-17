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

import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { OrderCardComponent } from './components/order-card/order-card.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, FormsModule, EmptyStateComponent, OrderCardComponent, PaginationComponent],
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
  total = signal<number>(0);
  page = signal<number>(1);
  limit = signal<number>(10);
  totalPages = signal<number>(1);

  // Filters
  filterShop = signal<string>('');
  filterItem = signal<string>('');
  filterStatus = signal<string>('');
  filterMinTotal = signal<number | null>(null);
  filterMaxTotal = signal<number | null>(null);

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
    const query: any = {
      page: this.page(),
      limit: this.limit()
    };

    if (this.filterShop()) query.shop = this.filterShop();
    if (this.filterItem()) query.item = this.filterItem();
    if (this.filterStatus()) query.status = this.filterStatus();
    if (this.filterMinTotal() !== null) query.minTotal = this.filterMinTotal();
    if (this.filterMaxTotal() !== null) query.maxTotal = this.filterMaxTotal();

    this.orderService.getMyOrders(query).subscribe({
      next: (res: OrderResponse) => {
        this.orders.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages || Math.ceil(res.total / this.limit()));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    this.page.set(1);
    this.loadOrders();
  }

  resetFilters() {
    this.filterShop.set('');
    this.filterItem.set('');
    this.filterStatus.set('');
    this.filterMinTotal.set(null);
    this.filterMaxTotal.set(null);
    this.page.set(1);
    this.loadOrders();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.page.set(newPage);
      this.loadOrders();
    }
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
