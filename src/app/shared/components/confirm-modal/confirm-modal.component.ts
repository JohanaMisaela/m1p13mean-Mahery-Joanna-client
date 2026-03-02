import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faQuestionCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Êtes-vous sûr de vouloir continuer ?';
  @Input() confirmText: string = 'Confirmer';
  @Input() cancelText: string = 'Annuler';
  @Input() type: ConfirmType = 'warning';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  icons = {
    question: faQuestionCircle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
    close: faTimes,
  };

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
