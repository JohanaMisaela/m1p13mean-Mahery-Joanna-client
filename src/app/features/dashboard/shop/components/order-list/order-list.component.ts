import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../../core/services/order.service';
import { Order, OrderResponse } from '../../../../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ShopOrderCardComponent } from '../order-card/shop-order-card.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, ShopOrderCardComponent, EmptyStateComponent],
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

    // Icons
    icons = {
        left: faChevronLeft,
        right: faChevronRight
    };

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders() {
        if (!this.shopId) {
            console.error('No shopId provided to OrderListComponent');
            return;
        }

        this.loading.set(true);
        this.orderService.getShopOrders(this.shopId, { page: this.page(), limit: this.limit() })
            .subscribe({
                next: (res: OrderResponse) => {
                    this.orders.set(res.data);
                    this.total.set(res.total);
                    this.totalPages.set(res.totalPages);
                    this.loading.set(false);
                },
                error: (err: any) => {
                    console.error('Failed to load orders', err);
                    this.loading.set(false);
                }
            });
    }

    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.totalPages()) {
            this.page.set(newPage);
            this.loadOrders();
        }
    }

    updateStatus(event: { order: Order, status: string }) {
        const { order, status } = event;
        // The confirm and status label logic is now in the component, but we can keep a simpler version here if needed or move label logic back
        // Actually, updateStatus in card component just emits. We should probably keep the confirmation here or handle it there.
        // I'll keep the confirmation here for safety but use a simpler label.

        const label = status === 'CONFIRMED' ? 'Confirmée' : status === 'CANCELLED' ? 'Annulée' : status === 'SHIPPED' ? 'Expédiée' : status;
        if (!confirm(`Changer le statut de la commande en ${label} ?`)) return;

        this.orderService.updateOrderStatus(order._id, status).subscribe({
            next: (updatedOrder: Order) => {
                // Update local state
                const currentOrders = this.orders();
                const index = currentOrders.findIndex(o => o._id === order._id);
                if (index !== -1) {
                    currentOrders[index] = { ...currentOrders[index], status: updatedOrder.status } as Order;
                    this.orders.set([...currentOrders]);
                }
            },
            error: (err: any) => console.error('Failed to update status', err)
        });
    }
}
