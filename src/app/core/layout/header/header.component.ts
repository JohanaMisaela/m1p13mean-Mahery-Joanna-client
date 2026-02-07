import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faBars, faTimes, faCog, faBox, faSignOutAlt, faTachometerAlt, faStore, faHeart } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-header',
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    templateUrl: './header.component.html',
    styles: []
})
export class HeaderComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly currentUser = this.authService.currentUser;

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
        heart: faHeart
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
