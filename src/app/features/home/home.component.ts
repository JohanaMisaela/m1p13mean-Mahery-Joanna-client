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
import { faSearch, faTimes, faFilter, faCartPlus, faStar, faStore } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FontAwesomeModule],
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

  // Icons
  protected icons = {
    search: faSearch,
    close: faTimes,
    filter: faFilter,
    cart: faCartPlus,
    star: faStar,
    shop: faStore
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
        console.log('Categories loaded:', cats);
        this.categories.set(Array.isArray(cats) ? cats : cats.data || []);
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadShops(): void {
    this.shopService.getShops().subscribe({
      next: (shops: any) => {
        console.log('Shops loaded:', shops);
        this.shops.set(Array.isArray(shops) ? shops : shops.data || []);
      },
      error: (err) => console.error('Error loading shops', err)
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const filters = this.filterForm.value;

    // Clean filters
    const params: any = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.isOnSale) params.isOnSale = filters.isOnSale;

    this.productService.getProducts(params).subscribe({
      next: (response: any) => {
        // Handle pagination response wrapper
        const data = Array.isArray(response) ? response : (response.data || []);
        this.products.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.loading.set(false);
      }
    });
  }

  toggleSidebar(): void {
    this.showFilterSidebar.update(v => !v);
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }
}
