import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStore, faMapMarkerAlt, faPhone, faEnvelope, faClock, faStar, faFlag, faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { Shop } from '../../../../shared/models/product.model';
import { User } from '../../../../shared/models/user.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { ShopReportComponent } from '../../../../features/shops/components/shop-report/shop-report.component';

@Component({
    selector: 'app-shop-header',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, StarRatingComponent, ShopReportComponent],
    template: `
    <div class="bg-white border mt-4 border-gray-100 p-6 mb-8 relative group shrink-0">
        <div class="flex flex-col md:flex-row gap-8">
            <!-- Shop Logo -->
            <div
                class="w-24 h-24 bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner shrink-0">
                <img *ngIf="shop?.gallery?.[0] || shop?.logo" [src]="shop?.gallery?.[0] || shop?.logo"
                    class="w-full h-full object-cover">
                <fa-icon *ngIf="!(shop?.gallery?.[0] || shop?.logo)" [icon]="icons.shop"
                    class="text-3xl text-gray-200"></fa-icon>
            </div>

            <!-- Shop Info -->
            <div class="flex-1">
                <div class="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <div class="flex items-center gap-4">
                        <h1 class="text-3xl font-black italic uppercase tracking-tighter">{{ shop?.name }}</h1>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-3">
                        <!-- Interactive Rating -->
                        <div class="flex flex-col items-end">
                            <span class="text-[8px] uppercase tracking-widest font-black text-gray-400 mb-1">Noter la boutique</span>
                            <app-star-rating [interactive]="true" [rating]="userRating"
                                (ratingChange)="onRatingChange($event)" size="small"></app-star-rating>
                        </div>
                        @if (shop && currentUser) {
                        <app-shop-report [shopId]="shop!._id" [currentUser]="currentUser"></app-shop-report>
                        }
                    </div>
                </div>

                <p class="text-gray-500 text-sm font-light mb-2 italic">{{ shop?.slogan || 'Boutique exclusive' }}</p>
                <!-- Ratings Display -->
                <app-star-rating [rating]="shop?.averageRating || 0" [totalRatings]="shop?.totalRatings || 0"
                    size="small"></app-star-rating>

                <!-- Details Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
                    <!-- Hours -->
                    <div class="flex flex-col">
                        <span class="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Horaires</span>
                        <div class="flex items-center gap-2 text-[10px] font-medium text-gray-600 uppercase">
                            <fa-icon [icon]="icons.clock" class="text-gray-300"></fa-icon>
                            {{ shop?.openingHours || '8:00 - 18:00' }}
                        </div>
                    </div>

                    <!-- Contact -->
                    <div class="flex flex-col">
                        <span class="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Contact / Social</span>
                        <div class="flex items-center gap-4 text-[10px] text-gray-400">
                            <a [href]="'tel:' + shop?.phone" class="hover:text-black transition-colors" title="Appeler">
                                <fa-icon [icon]="icons.phone"></fa-icon>
                            </a>
                            <a [href]="'mailto:' + shop?.email" class="hover:text-black transition-colors" title="Email">
                                <fa-icon [icon]="icons.email"></fa-icon>
                            </a>
                            <a *ngIf="shop?.socialLinks?.facebook" [href]="shop?.socialLinks?.facebook" target="_blank"
                                class="hover:text-black transition-colors" title="Facebook">
                                <fa-icon [icon]="icons.facebook"></fa-icon>
                            </a>
                            <a *ngIf="shop?.socialLinks?.instagram" [href]="shop?.socialLinks?.instagram" target="_blank"
                                class="hover:text-black transition-colors" title="Instagram">
                                <fa-icon [icon]="icons.instagram"></fa-icon>
                            </a>
                            <a *ngIf="shop?.socialLinks?.tiktok" [href]="shop?.socialLinks?.tiktok" target="_blank"
                                class="hover:text-black transition-colors" title="TikTok">
                                <fa-icon [icon]="icons.tiktok"></fa-icon>
                            </a>
                        </div>
                    </div>

                    <!-- Box Number -->
                    <div class="flex flex-col">
                        <span class="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Emplacement</span>
                        <div class="flex items-center gap-2 text-[10px] font-medium text-gray-600 uppercase">
                            <fa-icon [icon]="icons.location" class="text-gray-300"></fa-icon>
                            Box {{ shop?.mallBoxNumber }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
})
export class ShopHeaderComponent {
    @Input() shop: Shop | null = null;
    @Input() currentUser: User | null = null;
    @Input() userRating: number = 0;
    @Output() ratingChange = new EventEmitter<number>();

    protected icons = {
        shop: faStore,
        location: faMapMarkerAlt,
        phone: faPhone,
        email: faEnvelope,
        clock: faClock,
        star: faStar,
        report: faFlag,
        comment: faCommentAlt,
        facebook: faFacebook,
        instagram: faInstagram,
        tiktok: faTiktok
    };

    onRatingChange(rating: number) {
        this.ratingChange.emit(rating);
    }
}
