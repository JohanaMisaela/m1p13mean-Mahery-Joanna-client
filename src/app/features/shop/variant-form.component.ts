import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-variant-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div class="bg-white max-w-4xl w-full h-[85vh] shadow-2xl overflow-hidden rounded-[2.5rem] flex flex-col">
        
        <!-- Header -->
        <div class="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 class="text-3xl font-extralight uppercase tracking-[0.2em] text-gray-900">Configuer <span class="font-bold">la Variante</span></h3>
            <p class="text-[9px] text-gray-400 mt-2 uppercase tracking-[0.2em]">Sku & Custom attributes Control</p>
          </div>
          <button (click)="close.emit()" class="text-gray-300 hover:text-black transition-all transform hover:rotate-90 duration-300">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-grow overflow-y-auto p-12 custom-scrollbar">
          <form (ngSubmit)="submit()" class="space-y-12">
            
            <!-- Attributes Section -->
            <section>
              <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-6">Attributs de l'article</h4>
              <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-6">
                  <div *ngFor="let attr of attributeInputs(); let i = index" class="flex items-end space-x-6 animate-slideIn">
                      <div class="flex-1">
                          <label class="text-[8px] text-gray-400 uppercase font-black block mb-2 tracking-widest">Type (Ex: Couleur)</label>
                          <input type="text" [(ngModel)]="attr.key" [name]="'key'+i" 
                                 class="w-full border-b-2 border-gray-200 py-2 outline-none text-sm focus:border-black transition-all bg-transparent">
                      </div>
                      <div class="flex-1">
                          <label class="text-[8px] text-gray-400 uppercase font-black block mb-2 tracking-widest">Valeur (Ex: Bleu Marine)</label>
                          <input type="text" [(ngModel)]="attr.value" [name]="'value'+i" 
                                 class="w-full border-b-2 border-gray-200 py-2 outline-none text-sm focus:border-black transition-all bg-transparent font-bold">
                      </div>
                      <button type="button" (click)="removeAttribute(i)" 
                              class="text-gray-300 hover:text-red-500 transition-all p-2 bg-gray-100/50 rounded-full">
                         <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                         </svg>
                      </button>
                  </div>
                  <button type="button" (click)="addAttribute()" 
                          class="px-6 py-2 bg-white border border-gray-200 text-[9px] uppercase tracking-[0.2em] font-black text-black rounded-full hover:bg-black hover:text-white transition-all shadow-sm">
                    + Ajouter Caractéristique
                  </button>
              </div>
            </section>

            <!-- Price/Stock/SKU -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div class="space-y-3">
                    <label class="block text-[10px] uppercase font-black tracking-widest text-black">Prix (AR)</label>
                    <input type="number" [(ngModel)]="formData.price" name="price" required
                           class="w-full border-2 border-gray-100 p-4 focus:border-black outline-none transition-all rounded-xl text-xl font-bold">
                </div>
                <div class="space-y-3">
                    <label class="block text-[10px] uppercase font-black tracking-widest text-black">Quantité</label>
                    <input type="number" [(ngModel)]="formData.stock" name="stock" required
                           class="w-full border-2 border-gray-100 p-4 focus:border-black outline-none transition-all rounded-xl text-xl font-light italic">
                </div>
                <div class="space-y-3">
                    <label class="block text-[10px] uppercase font-black tracking-widest text-black">Code SKU</label>
                    <input type="text" [(ngModel)]="formData.sku" name="sku"
                           class="w-full border-2 border-gray-100 p-4 focus:border-black outline-none transition-all rounded-xl text-sm font-medium tracking-tighter" placeholder="REF-VAR-X">
                </div>
            </div>

            <!-- Media Section -->
            <section>
              <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-6">Visuels Spécifiques</h4>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div class="bg-black text-white p-8 rounded-3xl">
                      <div class="space-y-6">
                            <div class="relative group h-28 border border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-white transition-all bg-white/5">
                                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" multiple>
                                <div class="text-center group-hover:scale-105 transition-all">
                                    <p class="text-[9px] uppercase tracking-widest font-black">Charger Fichiers</p>
                                </div>
                            </div>
                            <div class="relative">
                                <input type="text" [(ngModel)]="newImageUrl" name="newImg"
                                       class="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-lg text-xs outline-none focus:border-white transition-all"
                                       placeholder="URL Directe">
                                <button (click)="addImageByUrl()" type="button"
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black underline uppercase tracking-widest">Add</button>
                            </div>
                      </div>
                  </div>

                  <div class="grid grid-cols-3 gap-4">
                      <div *ngFor="let img of formData.images; let i = index" class="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:scale-105">
                          <img [src]="img" class="h-full w-full object-cover">
                          <button type="button" (click)="removeImage(i)" 
                                  class="absolute top-1 right-1 bg-black text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] transform scale-0 group-hover:scale-100 transition-all shadow-lg">✕</button>
                      </div>
                      <div *ngIf="!formData.images.length" class="col-span-3 flex items-center justify-center h-full text-gray-200 italic text-xs border border-dashed border-gray-100 rounded-xl">
                          Pas de photo
                      </div>
                  </div>
              </div>
            </section>

          </form>
        </div>

        <div class="p-8 border-t border-gray-50 bg-white flex justify-between items-center">
          <button type="button" (click)="close.emit()" class="text-[10px] uppercase tracking-widest font-black text-gray-300 hover:text-black transition-all">Fermer</button>
          <button (click)="submit()" type="submit" 
                  class="px-12 py-4 bg-black text-white text-[10px] uppercase tracking-[0.4em] font-black hover:bg-gray-800 transition-all shadow-xl rounded-xl">
            Sauvegarder la Variante
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideIn { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  `]
})
export class VariantFormComponent implements OnInit {
  @Input() initialData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  attributeInputs = signal<{ key: string, value: string }[]>([{ key: '', value: '' }]);
  newImageUrl = '';

  formData = {
    price: 0,
    stock: 0,
    sku: '',
    attributes: {} as any,
    images: [] as string[]
  };

  ngOnInit() {
    if (this.initialData) {
      this.formData = {
        ...this.initialData,
        images: Array.isArray(this.initialData.images) ? [...this.initialData.images] : []
      };
      if (this.formData.attributes) {
        const attrs = Object.entries(this.formData.attributes).map(([key, value]) => ({ key, value: value as string }));
        this.attributeInputs.set(attrs.length ? attrs : [{ key: '', value: '' }]);
      }
    }
  }

  addAttribute() {
    this.attributeInputs.update(a => [...a, { key: '', value: '' }]);
  }

  removeAttribute(i: number) {
    this.attributeInputs.update(a => {
      const filtered = a.filter((_, idx) => idx !== i);
      return filtered.length ? filtered : [{ key: '', value: '' }];
    });
  }

  addImageByUrl() {
    if (this.newImageUrl.trim()) {
      this.formData.images.push(this.newImageUrl.trim());
      this.newImageUrl = '';
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.formData.images.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    this.formData.images.splice(index, 1);
  }

  submit() {
    const attrs: any = {};
    this.attributeInputs().forEach(a => {
      if (a.key.trim()) attrs[a.key.trim()] = a.value.trim();
    });
    this.formData.attributes = attrs;
    this.save.emit(this.formData);
  }
}
