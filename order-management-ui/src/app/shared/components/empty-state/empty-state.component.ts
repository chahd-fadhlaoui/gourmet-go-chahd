import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="icon">●</div>
      <p class="message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
    .empty-state { text-align:center; padding:28px; color:var(--muted); }
    .empty-state .icon { font-size:34px; color:var(--muted); margin-bottom:8px; }
    .empty-state .message { margin:0; font-weight:600; }
    `
  ]
})
export class EmptyStateComponent { @Input() message = 'No data available.'; }
