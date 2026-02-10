import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes, faStore, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Category, Shop } from '../../models/product.model';

@Component({
  selector: 'app-filter-sidebar',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, RouterLink],
  standalone: true,
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.scss'
})
export class FilterSidebarComponent {
  @Input({ required: true }) filterForm!: FormGroup;
  @Input() categories: Category[] = [];
  @Input() shops: Shop[] = [];
  @Input() isOpen = false;
  @Input() showShopFilter = true;
  @Input() currentPage = 1;
  @Input() totalPages = 1;

  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();

  protected icons = {
    search: faSearch,
    close: faTimes,
    shop: faStore,
    prev: faChevronLeft,
    next: faChevronRight
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
}
