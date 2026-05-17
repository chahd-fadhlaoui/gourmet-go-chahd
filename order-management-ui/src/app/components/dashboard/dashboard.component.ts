import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PillComponent } from '../../shared/components/pill/pill.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, UiCardComponent, EmptyStateComponent, SpinnerComponent, UiButtonComponent, PillComponent],
  template: `
    <div class="workflow-page container">
      <div class="hero">
        <div>
          <p class="eyebrow">Saga architecture</p>
          <h2>Workflow Overview</h2>
          <p class="subcopy">Order, kitchen and accounting read models side-by-side for quick operational insight.</p>
        </div>
        <app-ui-button (clicked)="loadWorkflow()" [disabled]="loading">{{ loading ? 'Refreshing...' : 'Refresh' }}</app-ui-button>
      </div>

      <div *ngIf="error" class="alert-error">{{ error }}</div>

      <div *ngIf="loading" class="center"><app-spinner></app-spinner></div>

      <div *ngIf="workflow && !loading" class="workflow-grid">
        <app-ui-card>
          <h3>Saga Status</h3>
          <div class="counts">
            <div *ngFor="let key of statusKeys" class="count-box">
              <div class="count">{{ workflow.statusCounts[key] || 0 }}</div>
              <div class="label">{{ key }}</div>
            </div>
          </div>
        </app-ui-card>

        <app-ui-card>
          <h3>Orders</h3>
          <ng-container *ngIf="workflow.orders?.length; else ordersEmpty">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Status</th><th>Created At</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of workflow.orders">
                    <td>{{ row.orderId }}</td>
                    <td><app-pill [text]="row.status" [variant]="row.status==='APPROVED' ? 'success' : row.status==='REJECTED' ? 'danger' : 'soft'"></app-pill></td>
                    <td>{{ formatTimestamp(row.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
          <ng-template #ordersEmpty><app-empty-state message="No orders found."></app-empty-state></ng-template>
        </app-ui-card>

        <app-ui-card>
          <h3>Kitchen Tickets</h3>
          <ng-container *ngIf="workflow.tickets?.length; else ticketsEmpty">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Status</th><th>Created At</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of workflow.tickets">
                    <td>{{ row.orderId }}</td>
                    <td><app-pill [text]="row.status" variant="soft"></app-pill></td>
                    <td>{{ formatTimestamp(row.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
          <ng-template #ticketsEmpty><app-empty-state message="No kitchen tickets yet."></app-empty-state></ng-template>
        </app-ui-card>

        <app-ui-card>
          <h3>Payments</h3>
          <ng-container *ngIf="workflow.payments?.length; else paymentsEmpty">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Amount</th><th>Authorized</th><th>Created At</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of workflow.payments">
                    <td>{{ row.orderId }}</td>
                    <td>{{ row.amount | number:'1.2-2' }}</td>
                    <td><app-pill [text]="row.authorized ? 'YES' : 'NO'" [variant]="row.authorized ? 'success' : 'danger'"></app-pill></td>
                    <td>{{ formatTimestamp(row.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
          <ng-template #paymentsEmpty><app-empty-state message="No payment records."></app-empty-state></ng-template>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [
    `
    .workflow-page { display:flex; flex-direction:column; gap:20px; max-width:1200px; margin:20px auto; }
    .hero { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:20px; border-radius:14px; background:linear-gradient(135deg,var(--surface) 0%, rgba(13,22,48,1) 100%); color:white; box-shadow:0 14px 28px rgba(2,6,23,0.25); }
    .eyebrow { margin:0 0 8px; text-transform:uppercase; letter-spacing:0.12em; font-size:12px; opacity:0.85; color:var(--accent); }
    .hero h2 { margin:0; font-size:26px; }
    .subcopy { margin:8px 0 0; max-width:760px; color:rgba(255,255,255,0.88); }
    app-ui-button { align-self:center; }
    .center { display:flex; justify-content:center; padding:28px; }
    .workflow-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:18px; }
    @media (max-width: 900px) { .workflow-grid { grid-template-columns: 1fr; } }
    .counts { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:12px; }
    .count-box { background:linear-gradient(180deg,#f4f7ff 0%,#edf3ff 100%); padding:14px; border-radius:10px; text-align:center; }
    .count { font-size:22px; font-weight:800; color:#1d2b53; }
    .label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:12px 10px; text-align:left; border-bottom:1px solid #eef1f8; }
    th { font-size:12px; text-transform:uppercase; color:var(--muted); }
    .alert-error { color:var(--pill-danger-fg); background:var(--pill-danger-bg); padding:12px 14px; border-radius:12px; }
    `
  ]
})
export class DashboardComponent implements OnInit {
  workflow: any = null;
  loading = false;
  error = '';
  statusKeys: string[] = [];

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadWorkflow();
  }

  formatTimestamp(timestamp: number): string {
    return timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
  }

  loadWorkflow() {
    this.loading = true;
    this.error = '';
    this.orderService.getWorkflowOverview().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.workflow = res.data;
          this.statusKeys = Object.keys(this.workflow.statusCounts || {});
        } else {
          this.error = res.message || 'Failed to load dashboard';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to load dashboard';
        this.cdr.detectChanges();
      }
    });
  }
}
