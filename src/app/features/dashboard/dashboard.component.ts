import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';

import { ShopListComponent } from './components/shop-list/shop-list.component';
import { UserListComponent } from './components/user-list/user-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ShopListComponent, UserListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  activeView = signal<'shops' | 'users'>('shops');

  manageMyShop() {
    this.shopService.getShops().subscribe(res => {
      const myShop = res.data.find((s: any) => s.owner?._id === this.currentUser()?._id);
      if (myShop) {
        this.router.navigate(['/admin/shop', myShop._id]);
      }
    });
  }
}
