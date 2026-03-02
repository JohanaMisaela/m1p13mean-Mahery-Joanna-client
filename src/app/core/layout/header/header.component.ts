import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faBars,
  faTimes,
  faCog,
  faBox,
  faSignOutAlt,
  faTachometerAlt,
  faStore,
  faHeart,
  faShoppingCart,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected unreadCount = signal<number>(0);
  private pollInterval: any;

  ngOnInit() {
    this.loadUnreadCount();
    this.startPolling();
  }

  private startPolling() {
    this.pollInterval = setInterval(() => {
      if (this.currentUser()) {
        this.loadUnreadCount();
      }
    }, 10000); // Poll every 10 seconds
  }

  private loadUnreadCount() {
    if (!this.currentUser()) return;
    this.chatService.getUnreadCount().subscribe((res) => {
      this.unreadCount.set(res.totalUnread);
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  // Icons
  protected readonly icons = {
    user: faUser,
    menu: faBars,
    close: faTimes,
    settings: faCog,
    orders: faBox,
    logout: faSignOutAlt,
    dashboard: faTachometerAlt,
    shop: faStore,
    heart: faHeart,
    cart: faShoppingCart,
    envelope: faEnvelope,
  };

  protected isMenuOpen = false;

  protected toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  protected closeMenu(): void {
    this.isMenuOpen = false;
  }

  protected logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
