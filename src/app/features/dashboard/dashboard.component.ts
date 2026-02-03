import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <!-- Header -->
      <header class="bg-black text-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold tracking-tight uppercase">Dashboard</h1>
          <button
            (click)="logout()"
            class="px-4 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors border border-transparent"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div class="bg-white border border-gray-200 shadow-sm p-8 max-w-2xl mx-auto text-center">
          
          <div class="mb-8">
            <h2 class="text-3xl font-light text-gray-800 mb-2">Welcome Back</h2>
            <p class="text-gray-500">{{ currentUser()?.email }}</p>
          </div>

          <div class="py-12 bg-gray-50 border border-gray-100">
            @if (currentUser()?.role === 'admin') {
                <div class="text-2xl font-bold text-black uppercase tracking-widest">
                    vous etes admin
                </div>
            } @else if (currentUser()?.role === 'shop') {
                <div class="text-2xl font-bold text-black uppercase tracking-widest">
                    vous etes shop
                </div>
            } @else {
               <div class="text-lg text-gray-400 italic">
                   Role non reconnu
               </div>
            }
          </div>

        </div>
      </main>
      
      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 mt-auto">
          <div class="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-xs uppercase tracking-wider">
              Ecommerce Dashboard &copy; 2026
          </div>
      </footer>
    </div>
  `,
  styles: ``
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  protected logout(): void {
    this.authService.logout();
  }
}
