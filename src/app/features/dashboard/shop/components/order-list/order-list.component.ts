import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../../core/services/order.service';
import { Order, OrderResponse } from '../../../../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faShoppingBag, faClock, faCheck, faTruck, faTimes, faChevronLeft, faChevronRight, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
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
        eye: faEye,
        bag: faShoppingBag,
        clock: faClock,
        check: faCheck,
        truck: faTruck,
        times: faTimes,
        left: faChevronLeft,
        right: faChevronRight,
        marker: faMapMarkerAlt
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

    getStatusClass(status: string): string {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getAttributesString(attributes: any): string {
        if (!attributes) return '';
        if (Array.isArray(attributes)) {
            return attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ');
        }
        return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'PENDING': return 'En attente';
            case 'CONFIRMED': return 'Confirmée';
            case 'SHIPPED': return 'Expédiée';
            case 'CANCELLED': return 'Annulée';
            default: return status;
        }
    }

    updateStatus(order: Order, newStatus: string) {
        if (!confirm(`Changer le statut de la commande en ${this.getStatusLabel(newStatus)} ?`)) return;

        this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
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
