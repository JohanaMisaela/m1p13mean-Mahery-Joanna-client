import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../../core/services/order.service';
import { Order, OrderResponse } from '../../../../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { ShopOrderCardComponent } from '../order-card/shop-order-card.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import {
  AppSelectComponent,
  SelectOption,
} from '../../../../../shared/components/app-select/app-select.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    ShopOrderCardComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmModalComponent,
    AppSelectComponent,
  ],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);

  @Input() shopId?: string;

  orders = signal<Order[]>([]);
  total = signal<number>(0);
  page = signal<number>(1);
  limit = signal<number>(10);
  totalPages = signal<number>(1);
  loading = signal<boolean>(false);

  // Filters
  filterClient = signal<string>('');
  filterItem = signal<string>('');
  filterStatus = signal<string>('');
  filterMinTotal = signal<number | null>(null);
  filterMaxTotal = signal<number | null>(null);

  // Confirm Modal state
  showConfirmModal = signal<boolean>(false);
  pendingUpdate = signal<{ order: Order; status: string; label: string } | null>(null);

  // Icons
  icons = {
    bag: faShoppingBag,
  };

  statusOptions: SelectOption[] = [
    { label: 'Tous les statuts', value: '' },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Confirmée', value: 'CONFIRMED' },
    { label: 'Expédiée', value: 'SHIPPED' },
    { label: 'Annulée', value: 'CANCELLED' },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    if (!this.shopId) {
      console.error('No shopId provided to OrderListComponent');
      return;
    }

    const query: any = {
      page: this.page(),
      limit: this.limit(),
    };

    if (this.filterClient()) query.client = this.filterClient();
    if (this.filterItem()) query.item = this.filterItem();
    if (this.filterStatus()) query.status = this.filterStatus();
    if (this.filterMinTotal() !== null) query.minTotal = this.filterMinTotal();
    if (this.filterMaxTotal() !== null) query.maxTotal = this.filterMaxTotal();

    this.loading.set(true);
    this.orderService.getShopOrders(this.shopId, query).subscribe({
      next: (res: OrderResponse) => {
        this.orders.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load orders', err);
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    this.page.set(1);
    this.loadOrders();
  }

  resetFilters() {
    this.filterClient.set('');
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

  updateStatus(event: { order: Order; status: string }) {
    const { order, status } = event;
    const label =
      status === 'CONFIRMED'
        ? 'Confirmée'
        : status === 'CANCELLED'
          ? 'Annulée'
          : status === 'SHIPPED'
            ? 'Expédiée'
            : status === 'REJECTED'
              ? 'Rejetée'
              : status;

    this.pendingUpdate.set({ order, status, label });
    this.showConfirmModal.set(true);
  }

  confirmStatusUpdate() {
    const pending = this.pendingUpdate();
    if (!pending) return;

    const { order, status } = pending;
    this.showConfirmModal.set(false);

    this.orderService.updateOrderStatus(order._id, status).subscribe({
      next: (updatedOrder: Order) => {
        const currentOrders = this.orders();
        const index = currentOrders.findIndex((o) => o._id === order._id);
        if (index !== -1) {
          currentOrders[index] = { ...currentOrders[index], status: updatedOrder.status } as Order;
          this.orders.set([...currentOrders]);
        }
        this.pendingUpdate.set(null);
      },
      error: (err: any) => {
        console.error('Failed to update status', err);
        this.pendingUpdate.set(null);
      },
    });
  }

  cancelStatusUpdate() {
    this.showConfirmModal.set(false);
    this.pendingUpdate.set(null);
  }
}
