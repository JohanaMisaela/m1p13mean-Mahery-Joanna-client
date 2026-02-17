import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../../../shared/models/order.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingBag, faMapMarkerAlt, faChevronRight, faCheck, faTimes, faTruck, faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { OrderItemComponent } from '../../../../../shared/components/order-item/order-item.component';

@Component({
    selector: 'app-shop-order-card',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, OrderItemComponent],
    template: `
    <div class="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      <!-- Order Card Header -->
      <div class="px-8 py-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-6 bg-gray-50/30">
        <div class="flex items-center space-x-6">
          <div class="w-12 h-12 bg-white rounded-full border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
            <fa-icon [icon]="faShoppingBag"></fa-icon>
          </div>
          <div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1 font-bold">Référence</span>
            <span class="text-base font-semibold text-gray-900 leading-none">#{{ order._id.slice(-8).toUpperCase() }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-12">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1 font-bold">Date</span>
            <span class="text-sm text-gray-700 font-medium">{{ order.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
          </div>
          <div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-1 font-bold">Statut</span>
            <span [className]="'px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ' + statusClass()">
              {{ statusLabel() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Order Content -->
      <div class="p-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <!-- Client Info -->
          <div class="space-y-6">
            <h4 class="text-[10px] uppercase tracking-widest text-gray-400 font-bold italic border-b border-gray-50 pb-2">Client</h4>
            <div class="space-y-4">
              <div class="flex items-center space-x-3 group">
                <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center text-xs group-hover:bg-blue-100 transition-colors">
                  <fa-icon [icon]="faUser"></fa-icon>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ order.user?.username || 'Utilisateur' }}</span>
              </div>
              <div class="flex items-center space-x-3 group">
                <div class="w-8 h-8 rounded-full bg-purple-50 text-purple-400 flex items-center justify-center text-xs group-hover:bg-purple-100 transition-colors">
                  <fa-icon [icon]="faEnvelope"></fa-icon>
                </div>
                <span class="text-xs text-gray-500 truncate">{{ order.user?.email || 'Pas d\\'email' }}</span>
              </div>
            </div>
          </div>

          <!-- Items Preview -->
          <div class="lg:col-span-1 border-x border-gray-50 px-0 lg:px-8">
            <h4 class="text-[10px] uppercase tracking-widest text-gray-400 font-bold italic border-b border-gray-50 pb-2">Articles</h4>
            <div class="divide-y divide-gray-50 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <app-order-item *ngFor="let item of order.items" [item]="item"></app-order-item>
            </div>
          </div>

          <!-- Shipping Summary -->
          <div class="space-y-8 flex flex-col justify-between">
            <div>
              <h4 class="text-[10px] uppercase tracking-widest text-gray-400 font-bold italic border-b border-gray-50 pb-2 mb-4">Livraison</h4>
              <div class="flex items-start space-x-3 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <div class="mt-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm flex-shrink-0">
                  <fa-icon [icon]="faMapMarkerAlt" class="text-gray-400 text-[10px]"></fa-icon>
                </div>
                <div class="flex-grow">
                  <p class="text-xs text-gray-700 leading-relaxed font-normal">
                    {{ order.shippingAddress?.street }}<br>
                    <span class="font-medium">{{ order.shippingAddress?.zip }} {{ order.shippingAddress?.city }}</span><br>
                    <span class="text-gray-400">{{ order.shippingAddress?.country }}</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-gray-100">
              <div class="flex justify-between items-end">
                <div>
                  <h4 class="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-bold">Total commande</h4>
                  <p class="text-2xl font-semibold text-gray-900 tracking-tighter">{{ order.totalAmount | currency:'Ar ':'symbol':'1.0-0' }}</p>
                </div>
                
                <!-- Actions -->
                <div class="flex space-x-2">
                  <ng-container *ngIf="order.status === 'PENDING'">
                    <button (click)="onStatusUpdate('CONFIRMED')" 
                      class="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
                      <fa-icon [icon]="faCheck"></fa-icon>
                      <span>Confirmer</span>
                    </button>
                    <button (click)="onStatusUpdate('CANCELLED')" 
                      class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
                      <fa-icon [icon]="faTimes"></fa-icon>
                      <span>Annuler</span>
                    </button>
                  </ng-container>

                  <ng-container *ngIf="order.status === 'CONFIRMED'">
                    <button (click)="onStatusUpdate('SHIPPED')" 
                      class="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all flex items-center space-x-2 text-xs font-bold uppercase tracking-wider w-full justify-center">
                      <fa-icon [icon]="faTruck"></fa-icon>
                      <span>Expédier</span>
                    </button>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #f3f4f6;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #e5e7eb;
    }
  `]
})
export class ShopOrderCardComponent {
    @Input({ required: true }) order!: Order;
    @Output() statusUpdate = new EventEmitter<{ order: Order, status: string }>();

    faShoppingBag = faShoppingBag;
    faMapMarkerAlt = faMapMarkerAlt;
    faChevronRight = faChevronRight;
    faCheck = faCheck;
    faTimes = faTimes;
    faTruck = faTruck;
    faUser = faUser;
    faEnvelope = faEnvelope;

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

    onStatusUpdate(status: string) {
        this.statusUpdate.emit({ order: this.order, status });
    }
}
