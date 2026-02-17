import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderItem } from '../../models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingBag } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-order-item',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    template: `
    <div class="flex items-center space-x-6 py-4">
      <div class="w-16 h-20 bg-gray-50 flex-shrink-0 overflow-hidden rounded-sm border border-gray-100">
        <img *ngIf="item?.variant?.images?.[0] || item?.product?.images?.[0]"
             [src]="item?.variant?.images?.[0] || item?.product?.images?.[0]"
             class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
             alt="Article">
        <div *ngIf="!item?.variant?.images?.[0] && !item?.product?.images?.[0]"
             class="w-full h-full flex items-center justify-center text-gray-200">
          <fa-icon [icon]="faShoppingBag"></fa-icon>
        </div>
      </div>
      <div class="flex-grow min-w-0">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-gray-900 truncate">{{ item?.product?.name }}</p>
            <p *ngIf="item?.variant?.attributes"
               class="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">
              {{ getAttributesString(item.variant.attributes) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs font-medium text-gray-900">{{ (item?.price || 0) * (item?.quantity || 0) | currency:'Ar ':'code':'1.0-0' }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5">{{ item?.quantity }} x {{ item?.price | currency:'Ar ':'code':'1.0-0' }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrderItemComponent {
    @Input({ required: true }) item!: OrderItem;
    faShoppingBag = faShoppingBag;

    getAttributesString(attributes: any): string {
        if (!attributes) return '';
        if (Array.isArray(attributes)) {
            return attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ');
        }
        return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(', ');
    }
}
