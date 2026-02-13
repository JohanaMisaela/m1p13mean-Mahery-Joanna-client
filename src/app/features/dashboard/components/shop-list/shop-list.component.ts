import { Component, OnInit, inject, signal, Input, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStore, faEdit, faPowerOff, faCog } from '@fortawesome/free-solid-svg-icons';
import { ShopService } from '../../../../core/services/shop.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ReportService } from '../../../../core/services/report.service';
import { Shop, ShopResponse } from '../../../../shared/models/product.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './shop-list.component.html',
  styleUrl: './shop-list.component.css'
})
export class ShopListComponent implements OnInit {
  private readonly shopService = inject(ShopService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);
  protected readonly currentUser = this.authService.currentUser;

  // Icons
  protected readonly icons = {
    shop: faStore,
    edit: faEdit,
    status: faPowerOff,
    manage: faCog
  };

  @Input() onlyMyShops = false;

  shops = signal<Shop[]>([]);
  shopReportCounts = signal<{ [key: string]: number }>({});
  showAddForm = false;
  potentialOwners = signal<User[]>([]);
  errorMessage = signal<string | null>(null);

  newShop = {
    name: '',
    mallBoxNumber: '',
    owner: '',
    description: '',
    email: '',
    phone: ''
  };

  // Pagination state
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  currentPage = signal<number>(1);
  limit = signal<number>(10);

  constructor() {
    afterNextRender(() => {
      this.loadShops();
    });
  }

  ngOnInit() {
    // Initialization logic that doesn't require HTTP calls
  }

  loadShops() {
    const params: any = {
      page: this.currentPage(),
      limit: this.limit()
    };

    const user = this.authService.currentUser();
    if (user && (user.role === 'shop' || this.onlyMyShops)) {
      params.owner = user._id || user.id;
    }
    this.shopService.getShops(params).subscribe(res => {
      this.shops.set(res.data);
      this.totalItems.set(res.total);
      this.totalPages.set(res.totalPages);

      // Fetch report counts for each shop
      res.data.forEach((shop: any) => {
        const id = (shop._id || shop.id)?.toString();
        if (id) {
          this.reportService.getShopReports(id, { status: 'pending' }).subscribe(reportsRes => {
            this.shopReportCounts.update(counts => ({
              ...counts,
              [id]: reportsRes.total || 0
            }));
            console.log('Updated counts for', id, ':', reportsRes.total);
          });
        }
      });
    });
  }

  getReportCount(shop: any): number {
    const id = (shop._id || shop.id)?.toString();
    if (!id) return 0;
    return this.shopReportCounts()[id] || 0;
  }

  loadPotentialOwners() {
    this.userService.getAllUsers({ limit: 100 }).subscribe({
      next: (res) => {
        const owners = res.data.filter(u => u.role === 'shop' || u.role === 'admin');
        this.potentialOwners.set(owners);
      }
    });
  }

  onOwnerChange() {
    const owner = this.potentialOwners().find(u => (u._id || (u as any).id) === this.newShop.owner);
    if (owner) {
      if (owner.email) this.newShop.email = owner.email;
      if (owner.contact) this.newShop.phone = owner.contact;
    }
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.loadPotentialOwners();
      this.errorMessage.set(null);
    }
  }

  createShop(event: Event) {
    event.preventDefault();
    if (!this.newShop.owner) {
      this.errorMessage.set('Veuillez sélectionner un propriétaire');
      return;
    }

    this.shopService.createShop(this.newShop.owner, this.newShop).subscribe({
      next: () => {
        this.loadShops();
        this.showAddForm = false;
        this.newShop = { name: '', mallBoxNumber: '', owner: '', description: '', email: '', phone: '' };
      },
      error: (err) => {
        console.error('Error creating shop', err);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la création de la boutique');
      }
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
