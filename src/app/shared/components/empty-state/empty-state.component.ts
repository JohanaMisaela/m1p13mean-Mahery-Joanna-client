import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="flex-1 flex flex-col items-center justify-center text-center py-20">
      <p class="text-xl font-light text-gray-900 mb-2">{{ title }}</p>
      <p class="text-gray-400 text-xs mb-8 tracking-widest uppercase">{{ message }}</p>
      <button *ngIf="buttonText" (click)="onAction()"
        class="px-6 py-2 border-b-2 border-black text-black hover:bg-black hover:text-white transition-all text-[10px] uppercase font-bold tracking-[0.2em]">
        {{ buttonText }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      width: 100%;
    }
  `]
})
export class EmptyStateComponent {
  @Input({ required: true }) title: string = 'Aucun résultat';
  @Input({ required: true }) message: string = 'Essayez de modifier vos critères de recherche';
  @Input() buttonText?: string;
  @Input() icon?: IconDefinition;
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
