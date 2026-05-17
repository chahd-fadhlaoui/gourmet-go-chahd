import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-card">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
    .ui-card { background: var(--card-bg); border-radius: 12px; padding: 18px; box-shadow: var(--card-shadow); }
    `
  ]
})
export class UiCardComponent {}
