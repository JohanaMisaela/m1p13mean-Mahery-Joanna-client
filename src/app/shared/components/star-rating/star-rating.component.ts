import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-star-rating',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    template: `
    <div class="flex items-center gap-2">
      <!-- Star Display -->
      <div class="flex" [class.gap-1]="interactive">
        @for (star of stars(); track $index) {
          @if (interactive) {
            <button (click)="rate($index + 1)"
                    class="focus:outline-none transition-all transform hover:scale-110"
                    [class.text-2xl]="size === 'large'"
                    [class.text-yellow-400]="$index < rating"
                    [class.text-gray-300]="$index >= rating">
              <fa-icon [icon]="faStar"></fa-icon>
            </button>
          } @else {
            <fa-icon [icon]="faStar" 
                     [class.text-yellow-400]="star" 
                     [class.text-gray-200]="!star"
                     [ngClass]="sizeClasses"></fa-icon>
          }
        }
      </div>

      <!-- Optional Labels -->
      @if (!interactive && totalRatings !== undefined) {
        <span class="text-sm text-gray-500 font-light italic">({{ totalRatings }} {{ totalRatings > 1 ? 'avis' : 'avis' }})</span>
      }
    </div>
  `,
    styles: [`
    :host {
      display: inline-block;
    }
    .text-xxs { font-size: 0.6rem; }
  `]
})
export class StarRatingComponent {
    @Input() rating: number = 0;
    @Input() totalRatings?: number;
    @Input() interactive: boolean = false;
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    faStar = faStar;

    stars = computed(() => {
        return Array(5).fill(0).map((_, i) => i < Math.round(this.rating));
    });

    get sizeClasses() {
        return {
            'text-[8px]': this.size === 'small',
            'text-sm': this.size === 'medium',
            'text-xl': this.size === 'large'
        };
    }

    rate(value: number): void {
        if (this.interactive) {
            this.rating = value;
            this.ratingChange.emit(value);
        }
    }

    @Output() ratingChange = new EventEmitter<number>();
}
