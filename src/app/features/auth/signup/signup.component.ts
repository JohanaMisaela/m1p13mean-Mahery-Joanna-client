import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-signup',
    imports: [CommonModule, RouterLink],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
    // This is a skeleton component for demonstration
    // Can be fully implemented later following the same pattern as LoginComponent
}
