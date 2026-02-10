import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ShopService } from '../../core/services/shop.service';
import { Shop } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilter, faStore, faChevronLeft, faChevronRight, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-public-shop-list',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule],
    templateUrl: './shop-list.component.html',
    styleUrl: './shop-list.component.css'
})
export class PublicShopListComponent implements OnInit {
    private readonly shopService = inject(ShopService);
    private readonly fb = inject(FormBuilder);

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
        close: faTimes
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
}
