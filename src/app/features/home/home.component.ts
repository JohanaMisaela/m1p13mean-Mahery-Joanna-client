import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ShopService } from '../../core/services/shop.service';
import { Product, Category, Shop } from '../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilter, faCartPlus, faStar, faStore, faChevronLeft, faChevronRight, faSearch } from '@fortawesome/free-solid-svg-icons';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { FilterSidebarComponent } from '../../shared/components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule, ProductCardComponent, FilterSidebarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly currentUser = this.authService.currentUser;

  // Signals
  protected products = signal<Product[]>([]);
  protected categories = signal<Category[]>([]);
  protected shops = signal<Shop[]>([]);
  protected loading = signal<boolean>(false);
  protected showFilterSidebar = signal<boolean>(false);

  // Pagination
  protected currentPage = signal<number>(1);
  protected totalPages = signal<number>(1);
  protected totalItems = signal<number>(0);
  protected itemsPerPage = signal<number>(12); // Adjustable

  // Icons
  protected icons = {
    filter: faFilter,
    cart: faCartPlus,
    star: faStar,
    shop: faStore,
    next: faChevronRight,
    prev: faChevronLeft,
    search: faSearch
  };

  // Filter Form
  protected filterForm: FormGroup = this.fb.group({
    search: [''],
    category: [''],
    minPrice: [''],
    maxPrice: [''],
    shop: [''],
    isOnSale: [false]
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadShops();
    this.loadProducts();

    // Debounce search input
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadProducts();
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats: any) => {
        this.categories.set(Array.isArray(cats) ? cats : cats.data || []);
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadShops(): void {
    this.shopService.getShops().subscribe({
      next: (shops: any) => {
        this.shops.set(Array.isArray(shops) ? shops : shops.data || []);
      },
      error: (err) => console.error('Error loading shops', err)
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const filters = this.filterForm.value;

    // Clean filters
    const params: any = {
      page: this.currentPage(),
      limit: this.itemsPerPage()
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.isOnSale) params.isOnSale = filters.isOnSale;
    if (filters.shop) params.shop = filters.shop;

    this.productService.getProducts(params).subscribe({
      next: (response: any) => {
        // Handle pagination response wrapper
        // Assumes backend returns { data: [], total: number, totalPages: number, page: number }
        const data = Array.isArray(response) ? response : (response.data || []);
        this.products.set(data);

        if (!Array.isArray(response)) {
          this.totalPages.set(response.totalPages || 1);
          this.totalItems.set(response.total || 0);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
      // Scroll to top of product grid
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleSidebar(): void {
    this.showFilterSidebar.update(v => !v);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.currentPage.set(1); // Reset to first page on filter reset
    this.loadProducts();
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }
}
