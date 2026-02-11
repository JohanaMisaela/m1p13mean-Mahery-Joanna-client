import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="flex justify-center items-center gap-x-8  ">
      <button (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1"
        class="text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-gray-400">
        <fa-icon [icon]="icons.prev"></fa-icon> Précédent
      </button>
      <span class="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-400">
        <span class="text-black font-bold">{{ currentPage }}</span> / {{ totalPages }}
      </span>
      <button (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages"
        class="text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-gray-400">
        Suivant <fa-icon [icon]="icons.next"></fa-icon>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PaginationComponent {
  @Input({ required: true }) currentPage: number = 1;
  @Input({ required: true }) totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  icons = {
    prev: faChevronLeft,
    next: faChevronRight
  };

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
