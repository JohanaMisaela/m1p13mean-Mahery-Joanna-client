import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShopService } from '../../../../core/services/shop.service';
import { Shop, ShopResponse } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop-list.component.html',
  styleUrl: './shop-list.component.css'
})
export class ShopListComponent implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  shops = signal<Shop[]>([]);

  // Pagination state
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(1);
  limit = signal<number>(10);

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    const params = {
      page: this.currentPage(),
      limit: this.limit()
    };
    this.shopService.getShops(params).subscribe(res => {
      this.shops.set(res.data);
      this.totalItems.set(res.total);
      this.totalPages.set(res.totalPages);
    });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadShops();
  }

  manageShop(shopId: string) {
    this.router.navigate(['/admin/shop', shopId]);
  }
}
