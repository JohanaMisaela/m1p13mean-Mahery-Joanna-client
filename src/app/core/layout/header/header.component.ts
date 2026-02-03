import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-header',
    imports: [CommonModule, RouterModule, FontAwesomeModule],
    templateUrl: './header.component.html',
    styles: []
})
export class HeaderComponent {
    private readonly authService = inject(AuthService);
    protected readonly currentUser = this.authService.currentUser;
    protected readonly faUser = faUser;
    private readonly router = inject(Router);


    protected logout(): void {
        this.authService.logout();
    }
}
