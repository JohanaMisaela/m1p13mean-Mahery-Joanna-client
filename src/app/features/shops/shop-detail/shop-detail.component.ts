import { Component, inject, signal, OnInit, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ShopService } from '../../../core/services/shop.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Shop, Product, Category } from '../../../shared/models/product.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faStore,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faClock,
  faFilter,
  faChevronRight,
  faChevronLeft,
  faArrowLeft,
  faStar,
  faFlag,
  faCommentAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';
import { ShopReportComponent } from '../components/shop-report/shop-report.component';
import { ShopHeaderComponent } from '../../dashboard/shop/components/shop-header/shop-header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';

@Component({
  selector: 'app-public-shop-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterLink,
    ProductCardComponent,
    ShopHeaderComponent,
    PaginationComponent,
    FilterSidebarComponent,
    EmptyStateComponent,
    FooterComponent,
    ShopReportComponent,
  ],
  templateUrl: './shop-detail.component.html',
  styleUrl: './shop-detail.component.css',
})
export class PublicShopDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly shopService = inject(ShopService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected currentUser = this.authService.currentUser;

  protected shop = signal<Shop | null>(null);
  protected products = signal<Product[]>([]);
  protected categories = signal<Category[]>([]);
  protected loading = signal<boolean>(true);
  protected loadingProducts = signal<boolean>(false);
  protected showFilterSidebar = signal<boolean>(false);
  protected currentPage = signal<number>(1);
  protected totalPages = signal<number>(1);
  protected totalItems = signal<number>(0);
  protected itemsPerPage = signal<number>(12);
  protected userRating = signal<number>(0);

  constructor() {
    afterNextRender(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadShop(id);
        this.loadCategories();
        this.loadProducts(id);

        if (this.currentUser()) {
          this.loadUserRating(id);
        }
      }
    });
  }

  protected icons = {
    shop: faStore,
    location: faMapMarkerAlt,
    phone: faPhone,
    email: faEnvelope,
    clock: faClock,
    filter: faFilter,
    next: faChevronRight,
    prev: faChevronLeft,
    back: faArrowLeft,
    star: faStar,
    report: faFlag,
    comment: faCommentAlt,
    facebook: faFacebook,
    instagram: faInstagram,
    tiktok: faTiktok,
  };

  protected filterForm: FormGroup = this.fb.group({
    search: [''],
    category: [''],
    minPrice: [''],
    maxPrice: [''],
    isOnSale: [false],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.filterForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
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
      error: () => this.loading.set(false),
    });
  }

  loadUserRating(shopId: string): void {
    this.shopService.getMyShopRating(shopId).subscribe({
      next: (res) => this.userRating.set(res?.rating || 0),
      error: () => this.userRating.set(0),
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        this.categories.set(Array.isArray(res) ? res : res.data || []);
      },
      error: () => {},
    });
  }

  loadProducts(shopId: string): void {
    this.loadingProducts.set(true);
    const filters = this.filterForm.value;

    const params: any = {
      shop: shopId,
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      isActive: true,
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.isOnSale) params.isOnSale = filters.isOnSale;

    this.productService.getProducts(params).subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : response.data || [];
        this.products.set(data);

        if (!Array.isArray(response)) {
          this.totalPages.set(response.totalPages || 1);
          this.totalItems.set(response.total || 0);
        }
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
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
    this.showFilterSidebar.update((v) => !v);
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      isOnSale: false,
    });
    this.currentPage.set(1);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProducts(id);
  }

  submitRating(rating: number): void {
    const shop = this.shop();
    if (!shop || !this.currentUser()) return;

    this.userRating.set(rating);
    this.shopService.rateShop(shop._id, rating).subscribe({
      next: () => this.loadShop(shop._id),
      error: () => {},
    });
  }
}
