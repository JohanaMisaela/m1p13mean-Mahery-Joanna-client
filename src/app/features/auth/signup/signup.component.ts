import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly isLoading = signal(false);
    protected readonly errorMessage = signal<string | null>(null);
    protected readonly showPassword = signal(false);

    protected readonly signupForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        surname: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        contact: [''],
        address: this.fb.group({
            street: [''],
            city: [''],
            zip: [''],
            country: ['']
        })
    }, { validators: this.passwordMatchValidator });

    /**
     * Validator to check if passwords match
     */
    private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    /**
     * Toggle password visibility
     */
    protected togglePasswordVisibility(): void {
        this.showPassword.update(value => !value);
    }

    /**
     * Handle form submission
     */
    protected onSubmit(): void {
        if (this.signupForm.invalid) {
            this.signupForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set(null);

        const { confirmPassword, ...registerData } = this.signupForm.value;

        // Remove empty address if not provided
        if (!registerData.address.street && !registerData.address.city) {
            delete registerData.address;
        }

        this.authService.register(registerData).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/']);
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
            }
        });
    }

    /**
     * Get form control error message
     */
    protected getErrorMessage(controlName: string): string {
        const control = this.signupForm.get(controlName);

        if (!control || !control.touched) {
            return '';
        }

        if (control.hasError('required')) {
            return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
        }

        if (control.hasError('email')) {
            return 'Please enter a valid email address';
        }

        if (control.hasError('minlength')) {
            const minLength = control.getError('minlength').requiredLength;
            return `Password must be at least ${minLength} characters`;
        }

        if (this.signupForm.hasError('passwordMismatch') && controlName === 'confirmPassword') {
            return 'Passwords do not match';
        }

        return '';
    }
}
