import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingBag, faMapMarkerAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { OrderItemComponent } from '../order-item/order-item.component';

@Component({
    selector: 'app-order-card',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, OrderItemComponent],
    template: `
    <div class="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <!-- Order Card Header -->
      <div class="px-8 py-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <fa-icon [icon]="faShoppingBag"></fa-icon>
          </div>
          <div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Commande</span>
            <span class="text-sm font-medium">#{{ order._id.slice(-8).toUpperCase() }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-12">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Date</span>
            <span class="text-sm text-gray-600">{{ order.createdAt | date:'longDate' }}</span>
          </div>
          <div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Statut</span>
            <span [className]="'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ' + statusClass()">
              {{ statusLabel() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Order Content -->
      <div class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Items Preview -->
          <div>
            <h4 class="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold italic">Articles</h4>
            <div class="divide-y divide-gray-50">
              <app-order-item *ngFor="let item of order.items" [item]="item"></app-order-item>
            </div>
          </div>

          <!-- Info Summary -->
          <div class="bg-gray-50 p-6 flex flex-col justify-between rounded-sm border border-gray-100">
            <div class="space-y-6">
              <div>
                <h4 class="text-[10px] uppercase tracking-widest text-gray-400 mb-3 font-bold italic">Adresse de livraison</h4>
                <div class="flex items-start space-x-3">
                  <div class="mt-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                    <fa-icon [icon]="faMapMarkerAlt" class="text-gray-400 text-[10px]"></fa-icon>
                  </div>
                  <div class="flex-grow">
                    <p class="text-xs text-gray-700 leading-relaxed font-normal">
                      {{ order.shippingAddress?.street }}<br>
                      {{ order.shippingAddress?.zip }} {{ order.shippingAddress?.city }}<br>
                      {{ order.shippingAddress?.country }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="pt-4 border-t border-gray-200/50">
                <h4 class="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold italic">Total payé</h4>
                <p class="text-2xl font-light text-gray-900 tracking-tighter">{{ order.totalAmount | currency:'Ar ':'symbol':'1.0-0' }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-8 flex flex-wrap gap-4 pt-6 border-t border-white">
              <button *ngIf="order.status === 'PENDING'" (click)="onCancel()"
                class="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-700 font-bold transition-colors">
                Annuler la commande
              </button>
              <div class="flex-grow"></div>
              <button class="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black font-bold transition-colors flex items-center space-x-2">
                <span>Voir détails</span>
                <fa-icon [icon]="faChevronRight" class="text-[8px]"></fa-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrderCardComponent {
    @Input({ required: true }) order!: Order;
    @Output() cancel = new EventEmitter<string>();

    faShoppingBag = faShoppingBag;
    faMapMarkerAlt = faMapMarkerAlt;
    faChevronRight = faChevronRight;

    statusLabel(): string {
        switch (this.order.status) {
            case 'PENDING': return 'En attente';
            case 'CONFIRMED': return 'Confirmée';
            case 'SHIPPED': return 'Expédiée';
            case 'CANCELLED': return 'Annulée';
            default: return this.order.status;
        }
    }

    statusClass(): string {
        switch (this.order.status) {
            case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'SHIPPED': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    }

    onCancel() {
        this.cancel.emit(this.order._id);
    }
}
