import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserAddress } from '../../shared/models/user.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faEnvelope,
  faIdBadge,
  faMapMarkerAlt,
  faLock,
  faPlus,
  faSave,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profil',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, ConfirmModalComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
})
export class ProfilComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly addresses = signal<UserAddress[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly message = signal<string | null>(null);

  // Icons
  protected readonly icons = {
    user: faUser,
    email: faEnvelope,
    role: faIdBadge,
    address: faMapMarkerAlt,
    lock: faLock,
    plus: faPlus,
    save: faSave,
    cancel: faTimes,
  };

  // UI State Signals
  protected readonly showAddressForm = signal<boolean>(false);
  protected readonly showPasswordForm = signal<boolean>(false);
  protected readonly isEditingProfile = signal<boolean>(false);

  // Confirm Modal state
  protected readonly showConfirmModal = signal<boolean>(false);
  protected readonly pendingAddressDelete = signal<UserAddress | null>(null);

  // Forms
  protected profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: [''],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
  });

  protected addressForm: FormGroup = this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    zip: ['', Validators.required],
    country: ['', Validators.required],
    isDefault: [false],
  });

  protected passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.loadAddresses();
    this.initProfileForm();
  }

  initProfileForm(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        surname: user.surname,
        email: user.email,
      });
    }
  }

  toggleEditProfile(): void {
    this.isEditingProfile.update((v) => !v);
    if (!this.isEditingProfile()) {
      this.initProfileForm(); // Reset on cancel
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading.set(true);
    // Prepare data - backend expects name, surname, email
    // Email is disabled in form but might need to be sent or ignored.
    // Backend updateProfile takes name, surname, email.
    const updateData = {
      name: this.profileForm.get('name')?.value,
      surname: this.profileForm.get('surname')?.value,
      email: this.currentUser()?.email, // Keep email same for now or allow edit if req
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.loading.set(false);
        this.isEditingProfile.set(false);
        this.authService.updateCurrentUser(updatedUser);
        this.toastService.success('Profil mis à jour avec succès');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error('Erreur lors de la mise à jour du profil');
      },
    });
  }

  loadAddresses(): void {
    this.userService.getAddresses().subscribe({
      next: (data) => this.addresses.set(data),
      error: (err) => console.error('Error loading addresses', err),
    });
  }

  toggleAddressForm(): void {
    this.showAddressForm.update((v) => !v);
    if (!this.showAddressForm()) this.addressForm.reset();
  }

  togglePasswordForm(): void {
    this.showPasswordForm.update((v) => !v);
    if (!this.showPasswordForm()) this.passwordForm.reset();
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;

    this.loading.set(true);
    this.userService.addAddress(this.addressForm.value).subscribe({
      next: (newAddress) => {
        // Optimistically add to list or reload
        this.addresses.update((list) => [...list, newAddress]);
        this.loading.set(false);
        this.toggleAddressForm();
        this.toastService.success('Adresse ajoutée avec succès');
        this.loadAddresses(); // Reload to ensure sync
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        this.toastService.error("Erreur lors de l'ajout de l'adresse");
      },
    });
  }

  setDefault(address: UserAddress): void {
    if (!address._id) return;
    this.loading.set(true);
    this.userService.setDefaultAddress(address._id).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.success('Adresse par défaut mise à jour');
        this.loadAddresses();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error('Erreur lors de la mise à jour');
      },
    });
  }

  deleteAddress(address: UserAddress): void {
    if (address.isDefault) {
      this.toastService.warning("Impossible de supprimer l'adresse par défaut");
      return;
    }
    this.pendingAddressDelete.set(address);
    this.showConfirmModal.set(true);
  }

  confirmDeleteAddress(): void {
    const address = this.pendingAddressDelete();
    if (!address || !address._id) return;

    this.showConfirmModal.set(false);
    this.loading.set(true);
    this.userService.deleteAddress(address._id).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.success('Adresse supprimée');
        this.addresses.update((list) => list.filter((a) => a._id !== address._id));
        this.pendingAddressDelete.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error('Erreur lors de la suppression');
        this.pendingAddressDelete.set(null);
      },
    });
  }

  cancelDeleteAddress(): void {
    this.showConfirmModal.set(false);
    this.pendingAddressDelete.set(null);
  }

  updatePassword(): void {
    // Backend expects: oldPassword, newPassword
    if (this.passwordForm.invalid) return;

    this.loading.set(true);
    const payload = {
      oldPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
    };

    this.userService.changePassword(payload as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.togglePasswordForm();
        this.toastService.success('Mot de passe modifié avec succès');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error('Erreur lors du changement de mot de passe');
      },
    });
  }
}
