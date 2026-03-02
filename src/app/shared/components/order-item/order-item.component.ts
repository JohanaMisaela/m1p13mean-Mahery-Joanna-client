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
    <div class="flex items-center space-x-6 py-4 group">
      <!-- Product Image -->
      <div
        class="w-16 h-20 bg-gray-50 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
      >
        <img
          *ngIf="item.variant?.images?.[0] || item.product.images[0]"
          [src]="item.variant?.images?.[0] || item.product.images[0]"
          class="w-full h-full object-cover"
          alt="Article"
        />
        <div
          *ngIf="!item.variant?.images?.[0] && !item.product.images[0]"
          class="w-full h-full flex items-center justify-center text-gray-200"
        >
          <fa-icon [icon]="faShoppingBag" class="text-xl"></fa-icon>
        </div>
      </div>

      <!-- Item Details -->
      <div class="flex-grow min-w-0">
        <div class="flex justify-between items-start gap-4">
          <div class="space-y-1">
            <p class="text-sm font-semibold text-gray-900 truncate tracking-tight">
              {{ item.product.name }}
            </p>

            <!-- Promotion Badge -->
            <div
              *ngIf="item.promotion || item.promotionDiscount"
              class="flex flex-col items-start gap-1 mb-1"
            >
              <div
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider"
              >
                -{{ item.promotionDiscount || item.promotion?.discountPercentage }}%
              </div>
              <span
                *ngIf="item.promotionName || item.promotion?.name"
                class="text-[9px] font-bold text-red-600 uppercase tracking-tight"
              >
                {{ item.promotionName || item.promotion?.name }}
              </span>
            </div>

            <p
              *ngIf="item.variant?.attributes"
              class="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none"
            >
              {{ getAttributesString(item.variant.attributes) }}
            </p>
          </div>

          <div class="text-right flex flex-col items-end">
            <!-- Prices -->
            <div class="flex flex-col">
              <span class="text-sm font-bold text-gray-900 tracking-tight">
                {{ item.price * item.quantity | currency: 'Ar ' : 'code' : '1.0-0' }}
              </span>
              <span
                *ngIf="item.promotion || item.promotionDiscount"
                class="text-[10px] text-gray-300 line-through decoration-gray-200"
              >
                {{ (item.originalPrice || 0) * item.quantity | currency: 'Ar ' : 'code' : '1.0-0' }}
              </span>
            </div>

            <p class="text-[10px] text-gray-400 font-medium mt-1">
              {{ item.quantity }} x {{ item.price | currency: 'Ar ' : 'code' : '1.0-0' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OrderItemComponent {
  @Input({ required: true }) item!: OrderItem;
  faShoppingBag = faShoppingBag;

  getAttributesString(attributes: any): string {
    if (!attributes) return '';
    if (Array.isArray(attributes)) {
      return attributes.map((attr) => `${attr.name}: ${attr.value}`).join(', ');
    }
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
}
