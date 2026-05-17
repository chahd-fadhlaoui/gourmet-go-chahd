import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dash-page">
      <!-- bg deco -->
      <div class="bg-glow" aria-hidden="true"></div>

      <div class="dash-inner container">

        <!-- ── HERO ──────────────────────────────────────── -->
        <div class="hero-bar">
          <div class="hero-text">
            <p class="eyebrow">🔥 Saga Architecture</p>
            <h1>Workflow Overview</h1>
            <p class="sub">Order, kitchen and payment read models — side-by-side for quick operational insight.</p>
          </div>
          <button class="refresh-btn" (click)="loadWorkflow()" [disabled]="loading">
            <span>{{ loading ? '⏳' : '🔄' }}</span>
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        <!-- Error -->
        <div *ngIf="error" class="err-alert">⚠️ {{ error }}</div>

        <!-- Loading -->
        <div *ngIf="loading" class="spinner-wrap">
          <div class="hot-spinner"></div>
        </div>

        <!-- Content -->
        <div *ngIf="workflow && !loading" class="dash-content">

          <!-- ── KPI TILES ─────────────────────────────── -->
          <div class="kpi-row">
            <div class="kpi-tile" *ngFor="let key of statusKeys; let i = index"
                 [style.--accent-color]="kpiColor(key)">
              <div class="kpi-inner">
                <div class="kpi-icon">{{ kpiIcon(key) }}</div>
                <div class="kpi-number">{{ workflow.statusCounts[key] || 0 }}</div>
                <div class="kpi-label">{{ key }}</div>
              </div>
            </div>
          </div>

          <!-- ── CHART + TABLES GRID ───────────────────── -->
          <div class="main-grid">

            <!-- Status Donut Chart -->
            <div class="chart-card">
              <h3>📊 Status Distribution</h3>
              <div class="donut-wrap">
                <canvas #donutCanvas width="240" height="240"></canvas>
                <div class="donut-center">
                  <span class="donut-total">{{ totalOrders }}</span>
                  <span class="donut-lbl">Orders</span>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item" *ngFor="let key of statusKeys">
                  <span class="legend-dot" [style.background]="legendColor(key)"></span>
                  <span class="legend-key">{{ key }}</span>
                  <span class="legend-val">{{ workflow.statusCounts[key] || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Tables column -->
            <div class="tables-col">

              <!-- Orders table -->
              <div class="data-card">
                <div class="dc-header">
                  <h3>🧾 Orders</h3>
                  <span class="dc-count">{{ workflow.orders?.length || 0 }}</span>
                </div>
                <ng-container *ngIf="workflow.orders?.length; else ordersEmpty">
                  <div class="table-scroll">
                    <table class="full-id-table">
                      <thead>
                        <tr>
                          <th>Order ID (Full)</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let order of workflow.orders">
                          <td class="mono full-id">{{ order.orderId }}</td>
                          <td><span class="pill" [class]="'pill-' + order.status.toLowerCase()">{{ order.status }}</span></td>
                          <td class="amount-cell">\${{ order.amount | number:'1.2-2' }}</td>
                          <td>{{ fmt(order.createdAt) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </ng-container>
                <ng-template #ordersEmpty><p class="empty-msg">No orders found.</p></ng-template>
              </div>

              <!-- Kitchen Tickets -->
              <div class="data-card">
                <div class="dc-header">
                  <h3>🍳 Kitchen Tickets</h3>
                  <span class="dc-count">{{ workflow.tickets?.length || 0 }}</span>
                </div>
                <ng-container *ngIf="workflow.tickets?.length; else ticketsEmpty">
                  <div class="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Order ID (Full)</th>
                          <th>Status</th>
                          <th>Item</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let ticket of workflow.tickets">
                          <td class="mono full-id">{{ ticket.orderId }}</td>
                          <td><span class="pill pill-soft">{{ ticket.status }}</span></td>
                          <td>{{ ticket.item || 'Pizza' }}</td>
                          <td>{{ fmt(ticket.createdAt) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </ng-container>
                <ng-template #ticketsEmpty><p class="empty-msg">No kitchen tickets yet.</p></ng-template>
              </div>

              <!-- Payments -->
              <div class="data-card">
                <div class="dc-header">
                  <h3>💳 Payments</h3>
                  <span class="dc-count">{{ workflow.payments?.length || 0 }}</span>
                </div>
                <ng-container *ngIf="workflow.payments?.length; else paymentsEmpty">
                  <div class="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Order ID (Full)</th>
                          <th>Amount</th>
                          <th>Auth</th>
                          <th>Transaction ID</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let payment of workflow.payments">
                          <td class="mono full-id">{{ payment.orderId }}</td>
                          <td class="amount-cell"><strong>\${{ payment.amount | number:'1.2-2' }}</strong></td>
                          <td><span class="pill" [class]="payment.authorized ? 'pill-approved' : 'pill-rejected'">{{ payment.authorized ? 'APPROVED' : 'DECLINED' }}</span></td>
                          <td class="mono small-id">{{ payment.transactionId || 'N/A' | slice:0:8 }}…</td>
                          <td>{{ fmt(payment.createdAt) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </ng-container>
                <ng-template #paymentsEmpty><p class="empty-msg">No payment records.</p></ng-template>
              </div>

            </div><!-- /tables-col -->
          </div><!-- /main-grid -->
        </div><!-- /dash-content -->

        <!-- Initial empty -->
        <div *ngIf="!workflow && !loading && !error" class="empty-state">
          <div class="es-icon">📋</div>
          <p>No workflow data — hit Refresh to load.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── PAGE ───────────────────────────────────── */
    .dash-page {
      min-height: 100vh;
      position: relative;
      padding-bottom: 60px;
      background: linear-gradient(135deg, #fef9f4 0%, #fff5ed 100%);
    }

    .bg-glow {
      position: fixed;
      top: -200px;
      right: -200px;
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, rgba(192,57,43,0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .dash-inner {
      position: relative;
      z-index: 1;
      padding-top: 48px;
      max-width: 1600px;
      margin: 0 auto;
      padding-left: 24px;
      padding-right: 24px;
    }

    /* ── HERO ───────────────────────────────────── */
    .hero-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .eyebrow { 
      font-size: 12px; 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 0.12em; 
      color: #f39c12; 
      margin-bottom: 6px; 
    }
    
    .hero-bar h1 { 
      font-family: 'Playfair Display', serif; 
      font-size: 44px; 
      color: #1a0500; 
      letter-spacing: -1px; 
      margin-bottom: 8px; 
    }
    
    .sub { 
      color: rgba(26,5,0,0.55); 
      font-size: 15px; 
      max-width: 600px; 
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 28px;
      background: linear-gradient(135deg, #c0392b, #e67e22);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 16px rgba(192,57,43,0.3);
      white-space: nowrap;
      flex-shrink: 0;
      align-self: center;
    }
    
    .refresh-btn:hover:not(:disabled) { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 28px rgba(192,57,43,0.4); 
    }
    
    .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Error / spinner */
    .err-alert { 
      background: rgba(239,68,68,0.1); 
      border: 1px solid rgba(239,68,68,0.3); 
      color: #dc2626; 
      padding: 14px 18px; 
      border-radius: 12px; 
      margin-bottom: 24px; 
    }
    
    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    
    .hot-spinner { 
      width: 48px; 
      height: 48px; 
      border-radius: 50%; 
      border: 4px solid rgba(230,126,34,0.2); 
      border-top-color: #e67e22; 
      animation: spin 1s linear infinite; 
    }
    
    @keyframes spin { to{transform:rotate(360deg)} }

    /* ── KPI TILES ──────────────────────────────── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .kpi-tile {
      background: white;
      border: 1px solid rgba(230,126,34,0.15);
      border-radius: 20px;
      padding: 2px;
      overflow: hidden;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .kpi-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(192,57,43,0.12); }

    .kpi-inner {
      background: white;
      border-radius: 18px;
      padding: 24px 18px;
      text-align: center;
      border-top: 3px solid var(--accent-color, #e67e22);
    }

    .kpi-icon { font-size: 32px; margin-bottom: 12px; }
    .kpi-number { 
      font-family: 'Playfair Display', serif; 
      font-size: 44px; 
      font-weight: 900; 
      color: var(--accent-color, #e67e22); 
      line-height: 1; 
    }
    .kpi-label { 
      font-size: 11px; 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      color: #6b7280; 
      margin-top: 8px; 
    }

    /* ── MAIN GRID ──────────────────────────────── */
    .main-grid {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 28px;
      align-items: start;
    }

    @media (max-width: 1100px) { 
      .main-grid { grid-template-columns: 1fr; } 
    }

    /* ── CHART CARD ─────────────────────────────── */
    .chart-card {
      background: white;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 8px 32px rgba(192,57,43,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      position: sticky;
      top: 88px;
    }

    .chart-card h3 {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      color: #1a0500;
      align-self: flex-start;
      margin: 0;
    }

    .donut-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 220px;
      height: 220px;
    }

    .donut-center {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      pointer-events: none;
    }

    .donut-total { 
      font-size: 38px; 
      font-weight: 900; 
      font-family: 'Playfair Display', serif; 
      color: #1a0500; 
    }
    
    .donut-lbl { 
      font-size: 11px; 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 0.08em; 
      color: #9ca3af; 
    }

    .chart-legend { 
      width: 100%; 
      display: flex; 
      flex-direction: column; 
      gap: 10px; 
    }
    
    .legend-item { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      font-size: 13px; 
      padding: 4px 0;
    }
    
    .legend-dot { 
      width: 12px; 
      height: 12px; 
      border-radius: 50%; 
      flex-shrink: 0; 
    }
    
    .legend-key { 
      flex: 1; 
      color: #374151; 
      font-weight: 500; 
    }
    
    .legend-val { 
      font-weight: 800; 
      color: #1a0500; 
      font-size: 16px;
    }

    /* ── TABLES COL ─────────────────────────────── */
    .tables-col { display: flex; flex-direction: column; gap: 24px; }

    .data-card {
      background: white;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 8px 28px rgba(192,57,43,0.08);
      overflow: hidden;
    }

    .dc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #fef3e8;
    }

    .dc-header h3 { 
      font-family: 'Playfair Display', serif; 
      font-size: 18px; 
      color: #1a0500; 
      margin: 0; 
    }
    
    .dc-count { 
      padding: 4px 12px; 
      background: linear-gradient(135deg, #fff3e0, #ffe8d6); 
      color: #c2410c; 
      border-radius: 30px; 
      font-size: 12px; 
      font-weight: 800; 
    }

    .table-scroll { 
      overflow-x: auto; 
      border-radius: 12px;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 13px; 
    }
    
    th { 
      padding: 12px 14px; 
      text-align: left; 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 0.08em; 
      color: #6b7280; 
      border-bottom: 1px solid #f0e6dc; 
      background: #fefaf7; 
      font-weight: 700;
    }
    
    td { 
      padding: 14px 14px; 
      border-bottom: 1px solid #f5ede5; 
      color: #374151; 
      vertical-align: middle;
    }
    
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fefbf8; }
    
    .mono { 
      font-family: 'SF Mono', 'Courier New', monospace; 
      font-size: 12px; 
    }
    
    .full-id {
      font-size: 11px;
      letter-spacing: 0.3px;
      color: #4b5563;
      font-weight: 500;
      background: #fefaf7;
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-block;
      font-family: 'SF Mono', monospace;
    }
    
    .amount-cell {
      font-weight: 600;
      color: #1a0500;
    }
    
    .small-id {
      font-size: 10px;
      color: #9ca3af;
    }

    /* Pills */
    .pill { 
      display: inline-flex; 
      align-items: center; 
      padding: 5px 12px; 
      border-radius: 30px; 
      font-size: 11px; 
      font-weight: 700; 
      letter-spacing: 0.03em; 
    }
    
    .pill-approved { background: #f0fdf4; color: #16a34a; }
    .pill-rejected { background: #fef2f2; color: #dc2626; }
    .pill-pending  { background: #fffbeb; color: #f59e0b; }
    .pill-processing { background: #fff7ed; color: #c2410c; }
    .pill-soft     { background: #fff7ed; color: #c2410c; }

    .empty-msg { 
      text-align: center; 
      color: #9ca3af; 
      padding: 32px; 
      font-style: italic; 
      font-size: 14px; 
    }

    /* Initial empty */
    .empty-state { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 16px; 
      padding: 80px; 
      background: white;
      border-radius: 24px;
      text-align: center;
    }
    
    .empty-state .es-icon { 
      font-size: 56px; 
      opacity: 0.5;
    }
    
    .empty-state p { 
      color: #6b7280; 
    }

    @media (max-width: 768px) {
      .dash-inner { padding-left: 16px; padding-right: 16px; }
      .hero-bar { flex-direction: column; align-items: flex-start; }
      .hero-bar h1 { font-size: 32px; }
      .kpi-row { grid-template-columns: repeat(2,1fr); }
      .full-id { font-size: 9px; }
      td { padding: 10px 8px; }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  workflow: any = null;
  loading = false;
  error = '';
  statusKeys: string[] = [];
  
  get totalOrders() { 
    return this.statusKeys.reduce((s, k) => s + (this.workflow?.statusCounts[k] || 0), 0); 
  }

  private COLORS: Record<string, string> = {
    APPROVED:    '#22c55e',
    REJECTED:    '#ef4444',
    PENDING:     '#f59e0b',
    PROCESSING:  '#e67e22',
    CANCELLED:   '#6b7280',
  };

  constructor(
    private orderService: OrderService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { 
    this.loadWorkflow(); 
  }
  
  ngAfterViewInit(): void { 
    // chart drawn after data loads
  }

  fmt(ts: number): string { 
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString(); 
  }

  kpiColor(key: string): string { 
    return this.COLORS[key.toUpperCase()] ?? '#e67e22'; 
  }
  
  kpiIcon(key: string): string {
    const icons: Record<string, string> = {
      APPROVED: '✅',
      REJECTED: '❌',
      PENDING: '⏳',
      PROCESSING: '🔥',
      CANCELLED: '🚫'
    };
    return icons[key.toUpperCase()] ?? '📦';
  }
  
  legendColor(key: string): string { 
    return this.COLORS[key.toUpperCase()] ?? '#e67e22'; 
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
          this.cdr.detectChanges();
          setTimeout(() => this.drawDonut(), 60);
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

  private drawDonut() {
    if (!this.donutCanvas) return;
    const canvas = this.donutCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const counts: Record<string, number> = this.workflow.statusCounts || {};
    const keys = this.statusKeys;
    const vals = keys.map(k => counts[k] || 0);
    const total = vals.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outerR = cx - 12;
    const innerR = cx * 0.54;
    let angle = -Math.PI / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    keys.forEach((k, i) => {
      const slice = (vals[i] / total) * Math.PI * 2;
      const color = this.COLORS[k.toUpperCase()] ?? '#e67e22';

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      angle += slice;
    });

    // Inner circle (donut hole)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Subtle shadow on inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}