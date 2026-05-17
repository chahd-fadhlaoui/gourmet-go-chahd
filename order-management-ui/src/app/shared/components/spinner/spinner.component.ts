import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner" aria-hidden="true"></div>
  `,
  styles: [
    `
    .spinner { width:36px; height:36px; border-radius:50%; border:4px solid var(--muted); border-top-color:var(--accent); animation:spin 1s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    `
  ]
})
export class SpinnerComponent {}
