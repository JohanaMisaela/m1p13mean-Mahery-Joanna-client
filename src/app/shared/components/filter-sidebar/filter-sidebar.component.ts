import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSearch,
  faTimes,
  faStore,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { Category, Shop } from '../../models/product.model';
import { AppSelectComponent, SelectOption } from '../app-select/app-select.component';

@Component({
  selector: 'app-filter-sidebar',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, RouterLink, AppSelectComponent],
  standalone: true,
  templateUrl: './filter-sidebar.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class FilterSidebarComponent {
  @Input({ required: true }) filterForm!: FormGroup;
  @Input() categories: Category[] = [];
  @Input() shops: Shop[] = [];
  @Input() isOpen = false;
  @Input() showShopFilter = true;
  @Input() currentPage = 1;
  @Input() totalPages = 1;

  @Input() sidebarLink = '/shops';
  @Input() sidebarLabel = 'Boutiques';
  @Input() sidebarNavText = 'Explorer';

  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();

  protected icons = {
    search: faSearch,
    close: faTimes,
    shop: faStore,
    prev: faChevronLeft,
    next: faChevronRight,
  };

  closeSidebar(): void {
    this.close.emit();
  }

  resetFilters(): void {
    this.reset.emit();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  get categoryOptions(): SelectOption[] {
    return [
      { label: 'Toutes les catégories', value: '' },
      ...this.categories.map((cat) => ({
        label: cat.name,
        value: cat._id || cat.name,
      })),
    ];
  }

  get shopOptions(): SelectOption[] {
    return [
      { label: 'Toutes les boutiques', value: '' },
      ...this.shops.map((shop) => ({
        label: shop.name,
        value: shop._id,
      })),
    ];
  }
}
