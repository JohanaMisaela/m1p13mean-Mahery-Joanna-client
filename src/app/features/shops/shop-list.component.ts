import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilter, faStore, faChevronLeft, faChevronRight, faSearch, faTimes, faHeart } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
    selector: 'app-public-shop-list',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule, PaginationComponent, EmptyStateComponent],
    templateUrl: './shop-list.component.html',
    styleUrl: './shop-list.component.css'
})
export class PublicShopListComponent implements OnInit {
    private readonly shopService = inject(ShopService);
    private readonly authService = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    protected currentUser = this.authService.currentUser;

    // Signals
    protected shops = signal<Shop[]>([]);
    protected loading = signal<boolean>(false);
    protected showFilterSidebar = signal<boolean>(false);

    // Pagination
    protected currentPage = signal<number>(1);
    protected totalPages = signal<number>(1);
    protected totalItems = signal<number>(0);
    protected itemsPerPage = signal<number>(12);

    // Icons
    protected icons = {
        filter: faFilter,
        shop: faStore,
        next: faChevronRight,
        prev: faChevronLeft,
        search: faSearch,
        close: faTimes,
        heart: faHeart
    };

    // Filter Form
    protected filterForm: FormGroup = this.fb.group({
        search: [''],
        isActive: [true]
    });

    ngOnInit(): void {
        this.loadShops();

        this.filterForm.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.currentPage.set(1);
            this.loadShops();
        });
    }

    loadShops(): void {
        this.loading.set(true);
        const filters = this.filterForm.value;

        const params: any = {
            page: this.currentPage(),
            limit: this.itemsPerPage(),
            isActive: true // Public list usually shows only active shops
        };

        if (filters.search) params.search = filters.search;

        this.shopService.getShops(params).subscribe({
            next: (response: any) => {
                const data = Array.isArray(response) ? response : (response.data || []);
                this.shops.set(data);

                if (!Array.isArray(response)) {
                    this.totalPages.set(response.totalPages || 1);
                    this.totalItems.set(response.total || 0);
                }

                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading shops', err);
                this.loading.set(false);
            }
        });
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
            this.loadShops();
            const mainContent = document.querySelector('main');
            if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    toggleSidebar(): void {
        this.showFilterSidebar.update(v => !v);
    }

    resetFilters(): void {
        this.filterForm.patchValue({ search: '' });
        this.currentPage.set(1);
        this.loadShops();
    }

    isFavorited(shop: Shop): boolean {
        const user = this.currentUser();
        if (!user || !shop.favoritedBy) return false;
        const userId = user._id || user.id;

        return shop.favoritedBy.some((fav: any) => {
            const favId = typeof fav === 'string' ? fav : (fav._id || fav.id);
            return favId === userId;
        });
    }

    toggleFavorite(event: Event, shop: Shop): void {
        event.preventDefault();
        event.stopPropagation();

        const user = this.currentUser();
        if (!user) return;
        const userId = user._id || user.id;

        const currentlyFavorited = this.isFavorited(shop);

        // Optimistic Update: Do it immediately
        const previousShops = this.shops();
        this.shops.update(currentShops =>
            currentShops.map(s => {
                if (s._id === shop._id) {
                    const favoritedBy = s.favoritedBy || [];
                    const updatedFavoritedBy: any[] = currentlyFavorited
                        ? favoritedBy.filter((fav: any) => {
                            const favId = typeof fav === 'string' ? fav : (fav._id || fav.id);
                            return favId !== userId;
                        })
                        : [...favoritedBy, userId];
                    return {
                        ...s,
                        favoritedBy: updatedFavoritedBy
                    } as Shop;
                }
                return s;
            })
        );

        // API Call in background
        this.shopService.toggleFavorite(shop._id, !currentlyFavorited).subscribe({
            error: (err) => {
                console.error('Failed to toggle favorite', err);
                // Rollback on error
                this.shops.set(previousShops);
            }
        });
    }
}
