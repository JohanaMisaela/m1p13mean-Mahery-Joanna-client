import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Shop } from '../../../../shared/models/product.model';

@Component({
    selector: 'app-shop-settings-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
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
           
           <!-- Logo URL -->
           <div class="md:col-span-2 space-y-1">
             <label class="text-[10px] uppercase text-gray-400 tracking-widest">URL du Logo</label>
             <input formControlName="logo" type="text"
               class="w-full border-b border-gray-200 bg-transparent py-2 focus:border-black outline-none transition-colors text-sm">
           </div>
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
    @Output() save = new EventEmitter<any>();

    private fb = inject(FormBuilder);
    shopForm!: FormGroup;

    ngOnInit() {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['shop'] && this.shop) {
            this.initForm(); // Re-init form when shop input changes
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
            socialLinks: this.fb.group({
                facebook: [this.shop?.socialLinks?.facebook || ''],
                instagram: [this.shop?.socialLinks?.instagram || ''],
                tiktok: [this.shop?.socialLinks?.tiktok || '']
            })
            // Intentionally omitting mallBoxNumber, owner, averageRating, totalRatings as they are read-only
        });
    }

    onSubmit() {
        if (this.shopForm.valid) {
            this.save.emit(this.shopForm.value);
        }
    }
}
