import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="ui-btn" [class.ghost]="variant==='ghost'" [disabled]="disabled" (click)="handleClick($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
    .ui-btn { border:0; padding:10px 14px; border-radius:10px; background:var(--btn-bg); color:var(--btn-fg); font-weight:700; cursor:pointer; }
    .ui-btn.ghost { background:transparent; color:var(--btn-ghost-fg); }
    .ui-btn:disabled { opacity:0.6; cursor:not-allowed; }
    `
  ]
})
export class UiButtonComponent { @Input() variant = 'default'; @Input() disabled = false; @Output() clicked = new EventEmitter<Event>(); handleClick(e: Event){ this.clicked.emit(e); } }
