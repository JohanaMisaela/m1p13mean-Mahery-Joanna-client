import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-shop-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './shop-dashboard.component.html',
    styleUrls: []
})
export class ShopDashboardComponent {
    private readonly authService = inject(AuthService);
    protected readonly currentUser = this.authService.currentUser;
}
