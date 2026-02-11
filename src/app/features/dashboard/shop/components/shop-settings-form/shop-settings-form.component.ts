import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Shop } from '../../../../../shared/models/product.model';
import { User } from '../../../../../shared/models/user.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-shop-settings-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  template: `
    <form [formGroup]="shopForm" (ngSubmit)="onSubmit()" class="space-y-6">
      <!-- General Info -->
      <div class="bg-white p-6 border border-gray-100 shadow-sm">
        <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-b pb-2">Informations Générales</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Name -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase text-gray-400 tracking-widest">Nom de la boutique</label>
            <input formControlName="name" type="text"
              class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
          </div>

          <!-- Slogan -->
          <div class="space-y-1">
             <label class="text-[10px] uppercase text-gray-400 tracking-widest">Slogan</label>
             <input formControlName="slogan" type="text"
               class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
          </div>

           <!-- Description -->
           <div class="md:col-span-2 space-y-1">
             <label class="text-[10px] uppercase text-gray-400 tracking-widest">Description</label>
             <textarea formControlName="description" rows="3"
               class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm resize-none"></textarea>
           </div>
           
           <!-- Logo -->
           <div class="md:col-span-2 space-y-4">
             <label class="text-[10px] uppercase text-gray-400 tracking-widest block">Logo</label>
             
             <!-- Preview & Upload -->
             <div class="flex items-center space-x-6">
                <div class="w-24 h-24 bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative group">
                    <img *ngIf="shopForm.get('logo')?.value" [src]="shopForm.get('logo')?.value" class="w-full h-full object-cover">
                    <div *ngIf="!shopForm.get('logo')?.value" class="text-gray-300 text-xs">NO LOGO</div>
                    
                    <!-- Remove Logo Button -->
                    <button *ngIf="shopForm.get('logo')?.value" type="button" (click)="removeLogo()" 
                        class="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <fa-icon [icon]="icons.times" size="xs"></fa-icon>
                    </button>
                </div>

                <div class="flex-1 space-y-2">
                    <!-- File Input -->
                    <div class="flex items-center">
                        <label class="cursor-pointer bg-black text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center space-x-2">
                            <fa-icon [icon]="icons.upload"></fa-icon>
                            <span>Uploader une image</span>
                            <input type="file" (change)="onLogoSelected($event)" accept="image/*" class="hidden">
                        </label>
                    </div>
                    
                    <!-- URL Input Fallback -->
                    <div class="text-xs text-gray-400 uppercase tracking-widest">OU</div>
                    <input formControlName="logo" type="text" placeholder="Coller une URL..."
                        class="w-full border-b border-gray-200 bg-transparent py-1 focus:border-black outline-none transition-colors text-sm">
                </div>
             </div>
           </div>
        </div>
      </div>

       <!-- Gallery Management -->
       <div class="bg-white p-6 border border-gray-100 shadow-sm">
        <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-b pb-2">Galerie Photos ({{ galleryImages.length }})</h3>
        
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div *ngFor="let img of galleryImages; let i = index" class="aspect-square bg-gray-50 border border-gray-100 relative group overflow-hidden">
                <img [src]="img" class="w-full h-full object-cover">
                <button type="button" (click)="removeGalleryImage(i)" 
                    class="absolute top-2 right-2 bg-white text-red-500 w-8 h-8 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50">
                    <fa-icon [icon]="icons.trash" size="sm"></fa-icon>
                </button>
            </div>

            <!-- Add Button -->
            <label class="aspect-square border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all text-gray-400 hover:text-black">
                <fa-icon [icon]="icons.upload" size="lg" class="mb-2"></fa-icon>
                <span class="text-[10px] uppercase tracking-widest font-bold">Ajouter</span>
                <input type="file" (change)="onGallerySelected($event)" multiple accept="image/*" class="hidden">
            </label>
        </div>
      </div>

       <!-- Contact & Social -->
       <div class="bg-white p-6 border border-gray-100 shadow-sm">
        <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-b pb-2">Contact & Réseaux Sociaux</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Phone -->
            <div class="space-y-1">
                <label class="text-[10px] uppercase text-gray-400 tracking-widest">Téléphone</label>
                <input formControlName="phone" type="text"
                  class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
            </div>

            <!-- Email -->
            <div class="space-y-1">
                <label class="text-[10px] uppercase text-gray-400 tracking-widest">Email</label>
                <input formControlName="email" type="email"
                  class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
            </div>

            <!-- Opening Hours -->
            <div class="md:col-span-2 space-y-1">
                <label class="text-[10px] uppercase text-gray-400 tracking-widest">Horaires d'ouverture</label>
                <input formControlName="openingHours" type="text"
                  class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
            </div>

            <!-- Social Links (Nested Group) -->
            <div formGroupName="socialLinks" class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-1">
                    <label class="text-[10px] uppercase text-gray-400 tracking-widest">Facebook</label>
                    <input formControlName="facebook" type="text"
                      class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] uppercase text-gray-400 tracking-widest">Instagram</label>
                    <input formControlName="instagram" type="text"
                      class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] uppercase text-gray-400 tracking-widest">TikTok</label>
                    <input formControlName="tiktok" type="text"
                      class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
                </div>
            </div>
        </div>
      </div>

      <!-- Admin Only: Shop Status -->
      <div *ngIf="currentUser?.role === 'admin'" class="bg-red-50 p-6 border border-red-100 shadow-sm">
        <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-b border-red-200 pb-2 text-red-800">Zone Administration</h3>
        
        <div class="flex items-center justify-between">
            <div>
                <h4 class="font-medium text-red-900">État de la boutique</h4>
                <p class="text-xs text-red-700 mt-1">Désactiver la boutique la rendra invisible pour les clients.</p>
            </div>
            
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" formControlName="isActive" class="sr-only peer">
                <div class="w-11 h-6 bg-red-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span class="ml-3 text-sm font-medium text-red-900">{{ shopForm.get('isActive')?.value ? 'ACTIVÉ' : 'DÉSACTIVÉ' }}</span>
            </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-4">
        <button type="submit" [disabled]="shopForm.invalid || shopForm.pristine"
          class="bg-black text-white px-8 py-3 uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
          Enregistrer les modifications
        </button>
      </div>

    </form>
  `
})
export class ShopSettingsFormComponent implements OnInit, OnChanges {
  @Input() shop: Shop | null = null;
  @Input() currentUser: User | null = null;
  @Output() save = new EventEmitter<any>();

  protected icons = {
    times: faTimes,
    upload: faUpload,
    trash: faTrash
  };

  private fb = inject(FormBuilder);
  shopForm!: FormGroup;
  galleryImages: string[] = [];

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['shop'] && this.shop) {
      this.initForm(); // Re-init form when shop input changes
      this.galleryImages = [...(this.shop.gallery || [])];
    }
  }

  initForm() {
    this.shopForm = this.fb.group({
      name: [this.shop?.name || '', [Validators.required]],
      slogan: [this.shop?.slogan || ''],
      description: [this.shop?.description || ''],
      logo: [this.shop?.logo || ''],
      phone: [this.shop?.phone || ''],
      email: [this.shop?.email || '', [Validators.email]],
      openingHours: [this.shop?.openingHours || ''],
      isActive: [this.shop?.isActive ?? true],
      socialLinks: this.fb.group({
        facebook: [this.shop?.socialLinks?.facebook || ''],
        instagram: [this.shop?.socialLinks?.instagram || ''],
        tiktok: [this.shop?.socialLinks?.tiktok || '']
      })
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.convertFileToBase64(file).then(base64 => {
        this.shopForm.patchValue({ logo: base64 });
        this.shopForm.markAsDirty();
      });
    }
  }

  removeLogo() {
    this.shopForm.patchValue({ logo: '' });
    this.shopForm.markAsDirty();
  }

  onGallerySelected(event: any) {
    const files = event.target.files;
    if (files) {
      const promises = Array.from(files).map((file: any) => this.convertFileToBase64(file));
      Promise.all(promises).then((results: string[]) => {
        this.galleryImages = [...this.galleryImages, ...results];
        this.shopForm.markAsDirty();
      });
    }
  }

  removeGalleryImage(index: number) {
    this.galleryImages.splice(index, 1);
    this.shopForm.markAsDirty();
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  onSubmit() {
    if (this.shopForm.valid) {
      const formValue = this.shopForm.value;
      // Add gallery images to the submission
      formValue.gallery = this.galleryImages;
      this.save.emit(formValue);
    }
  }
}
