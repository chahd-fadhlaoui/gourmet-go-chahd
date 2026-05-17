import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="pill" [ngClass]="variant">{{ text }}</span>
  `,
  styles: [
    `
    .pill { display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px; }
    .success { background:var(--pill-success-bg); color:var(--pill-success-fg); }
    .danger { background:var(--pill-danger-bg); color:var(--pill-danger-fg); }
    .soft { background:var(--pill-soft-bg); color:var(--pill-soft-fg); }
    `
  ]
})
export class PillComponent { @Input() text = ''; @Input() variant = 'soft'; }
