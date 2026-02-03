import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profil',
  imports: [],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
})
export class ProfilComponent {
  private readonly authService = inject(AuthService);
  protected readonly currentUser = this.authService.currentUser;

}
