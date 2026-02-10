import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStore, faEdit, faPowerOff, faCog } from '@fortawesome/free-solid-svg-icons';
import { ShopService } from '../../../../core/services/shop.service';
import { Shop, ShopResponse } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './shop-list.component.html',
  styleUrl: './shop-list.component.css'
})
export class ShopListComponent implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  // Icons
  protected readonly icons = {
    shop: faStore,
    edit: faEdit,
    status: faPowerOff,
    manage: faCog
  };

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

  toggleShopStatus(shop: Shop) {
    const newStatus = !shop.isActive;
    const id = shop._id || (shop as any).id;
    if (!id) return;

    this.shopService.updateStatus(id, newStatus).subscribe({
      next: () => this.loadShops(),
      error: (err: any) => console.error('Error updating shop status', err)
    });
  }
}
