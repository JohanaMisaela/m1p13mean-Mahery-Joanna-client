import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [HeaderComponent, RouterOutlet, FooterComponent],
    templateUrl: './main-layout.component.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }
    `]
})
export class MainLayoutComponent {
    private router = inject(Router);

    // Track route changes to detect sidebar
    private navEnd = toSignal(
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(event => (event as NavigationEnd).urlAfterRedirects)
        )
    );

    hasSidebar = computed(() => {
        const url = this.navEnd() || this.router.url;
        const cleanUrl = url.split('?')[0].split('#')[0]; // Remove query params and fragments

        return cleanUrl === '/' ||
            cleanUrl === '' ||
            cleanUrl.includes('/dashboard') ||
            cleanUrl.includes('/admin/shop/') ||
            cleanUrl.includes('/shops') ||
            (cleanUrl.startsWith('/shop/') && !cleanUrl.startsWith('/shops'));
    });
}
