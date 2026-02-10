import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [HeaderComponent, RouterOutlet, FooterComponent],
    templateUrl: './main-layout.component.html',
    styles: []
})
export class MainLayoutComponent { }
