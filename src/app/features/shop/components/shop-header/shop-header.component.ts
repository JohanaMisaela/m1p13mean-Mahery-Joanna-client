import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStore, faMapMarkerAlt, faPhone, faEnvelope, faClock, faStar, faFlag, faCommentAlt, faChevronLeft, faChevronRight, faImages } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { Shop } from '../../../../shared/models/product.model';
import { User } from '../../../../shared/models/user.model';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { ShopReportComponent } from '../../../../features/shops/components/shop-report/shop-report.component';

@Component({
    selector: 'app-shop-header',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, StarRatingComponent, ShopReportComponent],
    templateUrl: './shop-header.component.html',
    styleUrl: './shop-header.component.css'
})
export class ShopHeaderComponent implements OnChanges {
    @Input() shop: Shop | null = null;
    @Input() currentUser: User | null = null;
    @Input() userRating: number = 0;
    @Output() ratingChange = new EventEmitter<number>();

    currentGalleryIndex = signal(0);

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
        tiktok: faTiktok,
        prev: faChevronLeft,
        next: faChevronRight,
        images: faImages
    };

    ngOnChanges(changes: SimpleChanges) {
        if (changes['shop']) {
            this.currentGalleryIndex.set(0);
        }
    }

    onRatingChange(rating: number) {
        this.ratingChange.emit(rating);
    }

    nextImage() {
        if (!this.shop?.gallery?.length) return;
        const next = (this.currentGalleryIndex() + 1) % this.shop.gallery.length;
        this.currentGalleryIndex.set(next);
    }

    prevImage() {
        if (!this.shop?.gallery?.length) return;
        const prev = (this.currentGalleryIndex() - 1 + this.shop.gallery.length) % this.shop.gallery.length;
        this.currentGalleryIndex.set(prev);
    }
}
