import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faShoppingBag,
  faMapMarkerAlt,
  faChevronRight,
  faCheck,
  faTimes,
  faTruck,
  faUser,
  faEnvelope,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { OrderItemComponent } from '../../../../../shared/components/order-item/order-item.component';

@Component({
  selector: 'app-shop-order-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, OrderItemComponent],
  templateUrl: './shop-order-card.component.html',
  styleUrl: './shop-order-card.component.scss',
})
export class ShopOrderCardComponent {
  @Input({ required: true }) order!: Order;
  @Output() statusUpdate = new EventEmitter<{ order: Order; status: string }>();

  faShoppingBag = faShoppingBag;
  faMapMarkerAlt = faMapMarkerAlt;
  faChevronRight = faChevronRight;
  faCheck = faCheck;
  faTimes = faTimes;
  faTruck = faTruck;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faPhone = faPhone;

  statusLabel(): string {
    switch (this.order.status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'SHIPPED':
        return 'Expédiée';
      case 'CANCELLED':
        return 'Annulée';
      case 'REJECTED':
        return 'Rejetée';
      default:
        return this.order.status;
    }
  }

  statusClass(): string {
    switch (this.order.status) {
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'SHIPPED':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  }

  onStatusUpdate(status: string) {
    this.statusUpdate.emit({ order: this.order, status });
  }
}
