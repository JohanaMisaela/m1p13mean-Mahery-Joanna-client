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
  activeView = signal<'shops' | 'users' | 'myShops'>('shops');

  constructor() {
    const user = this.authService.currentUser();
    if (user && user.role === 'shop') {
      this.activeView.set('myShops');
    }
  }


}
