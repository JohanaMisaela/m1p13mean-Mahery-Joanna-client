import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Category, Shop } from '../../models/product.model';

@Component({
  selector: 'app-filter-sidebar',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  standalone: true,
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.scss'
})
export class FilterSidebarComponent {
  @Input({ required: true }) filterForm!: FormGroup;
  @Input() categories: Category[] = [];
  @Input() shops: Shop[] = [];
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  protected icons = {
    search: faSearch,
    close: faTimes
  };

  closeSidebar(): void {
    this.close.emit();
  }

  resetFilters(): void {
    this.reset.emit();
  }
}
