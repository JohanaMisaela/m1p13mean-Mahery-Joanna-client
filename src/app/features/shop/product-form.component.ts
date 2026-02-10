import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../shared/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div class="bg-white max-w-7xl w-full h-[95vh] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden rounded-[2.5rem] flex flex-col border border-white/20">
        
        <!-- Header -->
        <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 class="text-4xl font-extralight uppercase tracking-[0.3em] text-black">
                {{ editMode ? 'Éditer' : 'Créer' }} <span class="font-bold">le Produit</span>
            </h3>
            <p class="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-medium italic">Premium Inventory Management System</p>
          </div>
          <button (click)="close.emit()" class="group bg-black text-white p-3 rounded-full hover:rotate-90 transition-all duration-500 shadow-xl">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-grow overflow-y-auto p-12 custom-scrollbar bg-white">
          <form (ngSubmit)="submit()" class="space-y-16">
            
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-16">
              
              <!-- Left: Core Details (7/12) -->
              <div class="xl:col-span-7 space-y-16">
                
                <!-- Section 1: Basic Info -->
                <section>
                    <div class="flex items-center gap-4 mb-8">
                        <span class="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                        <h4 class="text-[11px] font-black uppercase tracking-[0.4em] text-black">Informations de Base</h4>
                    </div>
                    
                    <div class="space-y-10">
                        <div class="relative group">
                            <label class="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-2 block">Désignation du produit</label>
                            <input type="text" [(ngModel)]="formData.name" name="name" required
                                   class="w-full border-b-2 border-gray-100 py-3 focus:border-black outline-none transition-all text-2xl font-light placeholder-gray-100"
                                   placeholder="Ex: Basket Nike Air Jordan...">
                        </div>

                        <div class="grid grid-cols-2 gap-12">
                            <div class="relative">
                                <label class="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-2 block">Prix (Ar)</label>
                                <input type="number" [(ngModel)]="formData.price" name="price" required
                                       class="w-full border-b-2 border-gray-100 py-3 focus:border-black outline-none transition-all text-2xl font-bold">
                            </div>
                            <div class="relative">
                                <label class="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-2 block italic">Stock Global</label>
                                <input type="number" [(ngModel)]="formData.stock" name="stock"
                                       class="w-full border-b-2 border-gray-100 py-3 focus:border-black outline-none transition-all text-2xl font-light">
                            </div>
                        </div>

                        <div class="relative group">
                            <label class="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-2 block">Description Narrative</label>
                            <textarea [(ngModel)]="formData.description" name="description" rows="4"
                                      class="w-full border-b-2 border-gray-100 py-3 focus:border-black outline-none transition-all text-sm leading-relaxed translate-y-2"
                                      placeholder="Présentez votre produit en quelques mots..."></textarea>
                        </div>
                    </div>
                </section>

                <!-- Section 2: Attributes Config -->
                <section>
                    <div class="flex items-center gap-4 mb-8">
                        <span class="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                        <h4 class="text-[11px] font-black uppercase tracking-[0.4em] text-black">Configuration des Attributs</h4>
                    </div>
                    
                    <div class="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8">
                        <p class="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">Définissez les options (ex: Couleurs: Rouge, Bleu...). Appuyez sur Entrée pour ajouter une valeur.</p>
                        
                        <div class="space-y-10">
                            <div *ngFor="let attr of attributeConfigs(); let i = index" class="animate-slideUp space-y-4">
                                <div class="flex items-center gap-4">
                                    <input type="text" [(ngModel)]="attr.name" [name]="'attrName'+i"
                                           class="flex-1 border-b border-gray-300 py-2 bg-transparent focus:border-black outline-none text-[11px] uppercase font-black tracking-[0.2em]"
                                           placeholder="Nom du groupe (ex: TAILLE)">
                                    <button type="button" (click)="removeAttributeConfig(i)" 
                                            class="text-gray-300 hover:text-red-500 transition-all p-2 bg-white rounded-full shadow-sm">✕</button>
                                </div>
                                
                                <div class="flex flex-wrap gap-2 p-4 bg-white/50 border border-dashed border-gray-200 rounded-2xl min-h-[50px]">
                                    <div *ngFor="let val of attr.values; let j = index" 
                                         class="group relative pl-3 pr-8 py-1.5 bg-gray-100 text-black text-[9px] uppercase tracking-widest rounded-lg flex items-center transition-all hover:bg-black hover:text-white">
                                        {{ val }}
                                        <button (click)="removeAttributeValue(i, j)" type="button"
                                                class="absolute right-2 opacity-0 group-hover:opacity-100 transition-all font-bold">✕</button>
                                    </div>
                                    <input type="text" #valInput
                                           (keydown.enter)="$event.preventDefault(); addAttributeValue(i, valInput.value); valInput.value = ''"
                                           (blur)="addAttributeValue(i, valInput.value); valInput.value = ''"
                                           class="flex-grow bg-transparent outline-none text-[10px] min-w-[120px]"
                                           placeholder="+ Ajouter une valeur (Entrée)">
                                </div>
                            </div>
                        </div>

                        <button type="button" (click)="addAttributeConfig()" 
                                class="w-full text-[10px] uppercase tracking-widest font-black text-black border-2 border-black px-6 py-4 rounded-3xl hover:bg-black hover:text-white transition-all shadow-xl">
                            + Nouveau Groupe d'Attributs
                        </button>
                    </div>
                </section>

                <!-- Section 3: Categories (Multi-select) -->
                <section>
                    <div class="flex items-center gap-4 mb-8">
                        <span class="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                        <h4 class="text-[11px] font-black uppercase tracking-[0.4em] text-black">Catégorisation Multiple</h4>
                    </div>
                    
                    <div class="space-y-6">
                        <!-- Selection Area (Tags) -->
                        <div class="flex flex-wrap gap-3 p-6 bg-gray-50/30 border border-dashed border-gray-200 rounded-3xl min-h-[80px]">
                            <div *ngFor="let cat of selectedCategories(); let i = index" 
                                 class="group relative pl-5 pr-10 py-2 bg-black text-white text-[10px] uppercase tracking-widest rounded-full shadow-lg transition-all hover:scale-105 animate-slideUp">
                                {{ cat.name }}
                                <button (click)="removeCategory(i)" type="button" 
                                        class="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all font-bold hover:text-red-400">
                                    ✕
                                </button>
                            </div>
                            <div *ngIf="!selectedCategories().length" class="text-gray-300 text-[9px] uppercase tracking-[0.3em] italic flex items-center">
                                Aucune catégorie sélectionnée
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-8 items-end">
                            <div class="relative">
                                <label class="text-[9px] uppercase font-bold text-gray-400 mb-2 block">Ajouter une catégorie existante</label>
                                <select (change)="onCategorySelect($event)" value=""
                                        class="w-full border-b-2 border-gray-100 py-3 bg-transparent focus:border-black outline-none text-xs uppercase tracking-widest">
                                  <option value="" disabled selected>Choisir dans la liste...</option>
                                  <option *ngFor="let cat of categories()" [value]="cat._id">{{ cat.name }}</option>
                                </select>
                            </div>
                            <div class="relative">
                                <input type="text" [(ngModel)]="newCategoryName" name="newCat" 
                                       class="w-full border-b-2 border-gray-100 py-3 focus:border-black outline-none text-xs placeholder-gray-200"
                                       placeholder="+ Créer et ajouter">
                                <button *ngIf="newCategoryName" (click)="createNewCategory()" type="button"
                                        class="absolute right-0 bottom-3 text-[10px] font-black uppercase border-b-2 border-black">OK</button>
                            </div>
                        </div>
                    </div>
                </section>
              </div>

              <!-- Right: Content (5/12) -->
              <div class="xl:col-span-5 space-y-12">
                <section>
                    <div class="flex items-center gap-4 mb-8">
                        <span class="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                        <h4 class="text-[11px] font-black uppercase tracking-[0.4em] text-black">Contenu Visuel</h4>
                    </div>

                    <!-- Redesigned Image Upload -->
                    <div class="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 transition-all hover:border-black group relative shadow-inner">
                        <input type="file" (change)="onFileSelected($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" multiple>
                        
                        <div class="text-center group-hover:scale-105 transition-all duration-700">
                            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:bg-black group-hover:text-white transition-all">
                                <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p class="text-[11px] uppercase tracking-[0.4em] font-black mb-2">Importer des photos</p>
                            <p class="text-[9px] text-gray-400">Cliquer pour parcourir (JPG, PNG, WEBP)</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 my-8">
                        <div class="h-[1px] bg-gray-100 flex-grow"></div>
                        <span class="text-[9px] uppercase font-bold text-gray-300">ou via URL</span>
                        <div class="h-[1px] bg-gray-100 flex-grow"></div>
                    </div>

                    <div class="relative group">
                        <input type="text" [(ngModel)]="newImageUrl" name="newImg"
                               class="w-full border-b-2 border-gray-100 py-4 focus:border-black outline-none transition-all text-xs placeholder-gray-200 bg-transparent"
                               placeholder="https://votre-image.com/art.jpg">
                        <button (click)="addImageByUrl()" type="button"
                                class="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-black underline hover:no-underline">Injecter</button>
                    </div>

                    <!-- Visual Gallery -->
                    <div class="mt-16">
                        <h5 class="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-8 border-l-2 border-gray-400 pl-4">Galerie active ({{ formData.images.length }})</h5>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-8">
                            <div *ngFor="let img of formData.images; let i = index" 
                                 class="relative group aspect-square rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-50">
                                <img [src]="img" class="h-full w-full object-cover">
                                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                    <button type="button" (click)="removeImage(i)" 
                                            class="bg-white text-black p-4 rounded-full shadow-2xl transform scale-0 group-hover:scale-100 transition-all duration-300">
                                       <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                       </svg>
                                    </button>
                                </div>
                            </div>
                            <div *ngIf="!formData.images.length" class="col-span-full py-24 text-center border-2 border-dashed border-gray-50 rounded-[3rem] bg-gray-50/10">
                                <p class="text-[10px] uppercase tracking-[0.5em] text-gray-300 italic text-center">Aucun visuel</p>
                            </div>
                        </div>
                    </div>
                </section>
              </div>

            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="p-10 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center px-12">
          <button type="button" (click)="close.emit()" 
                  class="text-[11px] uppercase tracking-[0.3em] font-medium text-gray-400 hover:text-black transition-all">
            Abandonner
          </button>
          
          <button (click)="submit()" type="submit" 
                  class="px-20 py-5 bg-black text-white text-[12px] uppercase tracking-[0.4em] font-black hover:bg-gray-800 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-2 active:translate-y-0 rounded-2xl">
            Enregistrer le Produit
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
    .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-slideUp { animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProductFormComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);

  @Input() editMode = false;
  @Input() initialData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  categories = signal<Category[]>([]);
  selectedCategories = signal<Category[]>([]);

  attributeConfigs = signal<{ name: string, values: string[] }[]>([]);

  newImageUrl = '';
  newCategoryName = '';

  formData: any = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categories: [] as string[],
    images: [] as string[],
    attributeConfig: {}
  };

  ngOnInit() {
    this.categoryService.getCategories().subscribe((res: any) => {
      const data = Array.isArray(res) ? res : (res.data || []);
      this.categories.set(data);
      this.syncCategories();
    });

    if (this.initialData) {
      this.formData = {
        ...this.initialData,
        images: Array.isArray(this.initialData.images) ? [...this.initialData.images] : []
      };

      if (this.initialData.attributeConfig) {
        const configs = Object.entries(this.initialData.attributeConfig).map(([name, values]: [string, any]) => ({
          name,
          values: Array.isArray(values) ? [...values] : []
        }));
        this.attributeConfigs.set(configs.length ? configs : []);
      }

      this.formData.categories = Array.isArray(this.initialData.categories)
        ? this.initialData.categories.map((c: any) => c._id || c)
        : (this.initialData.category ? [this.initialData.category._id || this.initialData.category] : []);

      this.syncCategories();
    }
  }

  private syncCategories() {
    if (this.formData.categories?.length && this.categories().length) {
      const selected = this.categories().filter(c => this.formData.categories.includes(c._id));
      this.selectedCategories.set(selected);
    }
  }

  addAttributeConfig() {
    this.attributeConfigs.update(configs => [...configs, { name: '', values: [] }]);
  }

  removeAttributeConfig(index: number) {
    this.attributeConfigs.update(configs => configs.filter((_, i) => i !== index));
  }

  addAttributeValue(configIndex: number, value: string) {
    if (!value.trim()) return;
    this.attributeConfigs.update(configs => {
      const newConfigs = [...configs];
      if (!newConfigs[configIndex].values.includes(value.trim())) {
        newConfigs[configIndex].values.push(value.trim());
      }
      return newConfigs;
    });
  }

  removeAttributeValue(configIndex: number, valueIndex: number) {
    this.attributeConfigs.update(configs => {
      const newConfigs = [...configs];
      newConfigs[configIndex].values.splice(valueIndex, 1);
      return newConfigs;
    });
  }

  onCategorySelect(event: any) {
    const id = (event.target as HTMLSelectElement).value;
    const found = this.categories().find(c => c._id === id);
    if (found && !this.selectedCategories().some(c => c._id === id)) {
      this.selectedCategories.update(current => [...current, found]);
      this.formData.categories.push(found._id);
    }
  }

  removeCategory(index: number) {
    const cat = this.selectedCategories()[index];
    this.selectedCategories.update(current => current.filter((_, i) => i !== index));
    this.formData.categories = this.formData.categories.filter((id: string) => id !== cat._id);
  }

  createNewCategory() {
    if (!this.newCategoryName.trim()) return;
    this.categoryService.createCategory({ name: this.newCategoryName.trim(), type: 'product' }).subscribe({
      next: (newCat: any) => {
        this.categories.update(cats => [...cats, newCat]);
        this.selectedCategories.update(current => [...current, newCat]);
        this.formData.categories.push(newCat._id);
        this.newCategoryName = '';
      },
      error: () => this.newCategoryName = ''
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
    const config: any = {};
    this.attributeConfigs().forEach(attr => {
      if (attr.name.trim() && attr.values.length) {
        config[attr.name.trim()] = attr.values;
      }
    });
    this.formData.attributeConfig = config;

    // Filter categories to only send IDs
    const finalData = { ...this.formData };
    delete finalData.category; // Cleanup old field

    this.save.emit(finalData);
  }
}
