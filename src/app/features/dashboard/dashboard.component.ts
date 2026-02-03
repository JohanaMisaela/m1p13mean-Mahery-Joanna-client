import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col font-sans text-gray-900 h-full">
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
    </div>
  `,
  styles: ``
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

}
