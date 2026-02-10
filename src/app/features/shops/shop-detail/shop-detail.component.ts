import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ShopService } from '../../../core/services/shop.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Shop, Product, Category } from '../../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStore, faMapMarkerAlt, faPhone, faEnvelope, faClock, faFilter, faChevronRight, faChevronLeft, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
    selector: 'app-public-shop-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule, ProductCardComponent, FilterSidebarComponent],
    templateUrl: './shop-detail.component.html',
    styleUrl: './shop-detail.component.css'
})
export class PublicShopDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly shopService = inject(ShopService);
    private readonly productService = inject(ProductService);
    private readonly categoryService = inject(CategoryService);
    private readonly fb = inject(FormBuilder);

    // Signals
    protected shop = signal<Shop | null>(null);
    protected products = signal<Product[]>([]);
    protected categories = signal<Category[]>([]);
    protected loading = signal<boolean>(true);
    protected loadingProducts = signal<boolean>(false);
    protected showFilterSidebar = signal<boolean>(false);

    // Pagination
    protected currentPage = signal<number>(1);
    protected totalPages = signal<number>(1);
    protected totalItems = signal<number>(0);
    protected itemsPerPage = signal<number>(12);

    // Icons
    protected icons = {
        shop: faStore,
        location: faMapMarkerAlt,
        phone: faPhone,
        email: faEnvelope,
        clock: faClock,
        filter: faFilter,
        next: faChevronRight,
        prev: faChevronLeft,
        back: faArrowLeft
    };

    // Filter Form
    protected filterForm: FormGroup = this.fb.group({
        search: [''],
        category: [''],
        minPrice: [''],
        maxPrice: [''],
        isOnSale: [false]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadShop(id);
            this.loadCategories();
            this.loadProducts(id);

            this.filterForm.valueChanges.pipe(
                debounceTime(500),
                distinctUntilChanged()
            ).subscribe(() => {
                this.currentPage.set(1);
                this.loadProducts(id);
            });
        }
    }

    loadShop(id: string): void {
        this.shopService.getShopById(id).subscribe({
            next: (shop) => {
                this.shop.set(shop);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading shop', err);
                this.loading.set(false);
            }
        });
    }

    loadCategories(): void {
        this.categoryService.getCategories().subscribe({
            next: (res: any) => {
                this.categories.set(Array.isArray(res) ? res : res.data || []);
            },
            error: (err) => console.error('Error loading categories', err)
        });
    }

    loadProducts(shopId: string): void {
        this.loadingProducts.set(true);
        const filters = this.filterForm.value;

        const params: any = {
            shop: shopId,
            page: this.currentPage(),
            limit: this.itemsPerPage(),
            isActive: true
        };

        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.isOnSale) params.isOnSale = filters.isOnSale;

        this.productService.getProducts(params).subscribe({
            next: (response: any) => {
                const data = Array.isArray(response) ? response : (response.data || []);
                this.products.set(data);

                if (!Array.isArray(response)) {
                    this.totalPages.set(response.totalPages || 1);
                    this.totalItems.set(response.total || 0);
                }
                this.loadingProducts.set(false);
            },
            error: (err) => {
                console.error('Error loading products', err);
                this.loadingProducts.set(false);
            }
        });
    }

    onPageChange(page: number): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
            this.loadProducts(id);
            const mainContent = document.querySelector('.shop-products-container');
            if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    toggleSidebar(): void {
        this.showFilterSidebar.update(v => !v);
    }

    resetFilters(): void {
        this.filterForm.reset({
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            isOnSale: false
        });
        this.currentPage.set(1);
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.loadProducts(id);
    }
}
