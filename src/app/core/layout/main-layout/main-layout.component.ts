import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
    selector: 'app-main-layout',
    imports: [HeaderComponent, RouterOutlet],
    templateUrl: './main-layout.component.html',
    styles: []
})
export class MainLayoutComponent { }
