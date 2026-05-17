import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="oh-root">
      <div class="grid-bg" aria-hidden="true"></div>
      <div class="orb orb1" aria-hidden="true"></div>

      <div class="oh-inner">

        <!-- ── HEADER ───────────────────────── -->
        <div class="page-head">
          <p class="ph-eyebrow">ORDER LOOKUP</p>
          <h1 class="ph-title">Order<br><em>History</em></h1>
          <p class="ph-sub">Search by Order ID to trace the full saga journey.</p>
        </div>

        <!-- ── SEARCH ────────────────────────── -->
        <div class="search-block">
          <div class="sb-input-wrap">
            <span class="sb-prefix">ID</span>
            <input
              type="text"
              [(ngModel)]="searchOrderId"
              placeholder="Enter Order ID…"
              class="sb-input"
              (keyup.enter)="searchOrder()"
            />
            <button *ngIf="searchOrderId" class="sb-clear" (click)="clearSearch()" aria-label="Clear">✕</button>
          </div>
          <button class="search-btn" (click)="searchOrder()" [disabled]="loading">
            <span class="sbtn-icon">{{ loading ? '◌' : '▶' }}</span>
            <span>{{ loading ? 'SEARCHING…' : 'SEARCH' }}</span>
          </button>
        </div>
        <p class="search-hint">Copy an Order ID from the Workflow dashboard</p>

        <!-- Error -->
        <div *ngIf="error" class="err-bar">
          <span class="err-tag">ERR</span>{{ error }}
        </div>

        <!-- ── RESULT ─────────────────────────── -->
        <div *ngIf="orderStatus && !loading" class="result-area">

          <!-- Status header card -->
          <div class="status-header" [class]="'sh-' + (orderStatus.data.status || '').toLowerCase()">
            <div class="sh-left">
              <div class="sh-glyph">{{ statusGlyph(orderStatus.data.status) }}</div>
              <div>
                <span class="sh-eyebrow">STATUS</span>
                <h2 class="sh-status">{{ orderStatus.data.status || 'UNKNOWN' }}</h2>
              </div>
            </div>
            <div class="sh-meta">
              <div class="sm-field">
                <span class="smf-key">ORDER ID</span>
                <span class="smf-val mono">{{ orderStatus.data.orderId }}</span>
              </div>
              <div class="sm-field">
                <span class="smf-key">LAST EVENT</span>
                <span class="smf-val">{{ orderStatus.data.lastEvent || '—' }}</span>
              </div>
              <div class="sm-field">
                <span class="smf-key">RETRIEVED</span>
                <span class="smf-val mono">{{ fmt(orderStatus.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- Steps section -->
          <div *ngIf="orderStatus.data.steps?.length" class="steps-section">

            <!-- Curve chart -->
            <div class="chart-block">
              <div class="cb-head">
                <span class="cb-label">SAGA TIMELINE</span>
              </div>
              <div class="curve-container">
                <canvas #curveCanvas width="800" height="160"></canvas>
              </div>
            </div>

            <!-- Step bars -->
            <div class="bars-block">
              <div class="bb-head">
                <span class="bb-label">STEP PROGRESS</span>
              </div>
              <div class="bar-list">
                <div *ngFor="let step of orderStatus.data.steps; let i = index" class="bar-item">
                  <div class="bi-meta">
                    <span class="bi-num">{{ String(i+1).padStart(2,'0') }}</span>
                    <span class="bi-name">{{ step.label }}</span>
                    <span class="bi-svc">{{ step.service }}</span>
                  </div>
                  <div class="bi-track">
                    <div class="bi-fill" [class]="'fill-' + step.status"
                         [style.width]="barWidth(i, orderStatus.data.steps.length) + '%'">
                    </div>
                  </div>
                  <span class="bi-chip" [class]="'chip-' + step.status">{{ step.status }}</span>
                </div>
              </div>
            </div>

            <!-- Step detail grid -->
            <div class="step-grid">
              <div *ngFor="let step of orderStatus.data.steps; let i = index"
                   class="step-card"
                   [class]="'sc-' + step.status">
                <div class="scd-top">
                  <span class="scd-num">{{ String(i+1).padStart(2,'0') }}</span>
                  <h4 class="scd-title">{{ step.label }}</h4>
                  <span class="scd-svc">{{ step.service }}</span>
                </div>
                <p class="scd-action">{{ step.action }}</p>
                <p class="scd-desc">{{ step.description }}</p>
                <div *ngIf="step.errorMessage" class="scd-err">
                  <span class="err-tag">ERR</span> {{ step.errorMessage }}
                </div>
                <div class="scd-foot">
                  <span class="scd-status" [class]="'sts-' + step.status">{{ step.status }}</span>
                  <span *ngIf="step.timestamp" class="scd-ts">{{ fmt(step.timestamp) }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Initial state -->
        <div *ngIf="!searchPerformed && !loading" class="idle-state">
          <div class="is-glyph">
            <svg viewBox="0 0 80 80" width="72" height="72">
              <polygon points="40,4 74,22 74,58 40,76 6,58 6,22" fill="none" stroke="rgba(230,126,34,0.25)" stroke-width="1.5"/>
              <text x="40" y="47" text-anchor="middle" font-size="28" fill="#e67e22">🍕</text>
            </svg>
          </div>
          <h3>Search for an Order</h3>
          <p>Enter an Order ID to trace its full saga journey.</p>
        </div>

        <!-- Not found -->
        <div *ngIf="searchPerformed && !orderStatus && !loading && !error" class="not-found">
          <span class="nf-glyph">?</span>
          <h3>Order Not Found</h3>
          <p>No order matches that ID. Double-check and try again.</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── TOKENS ──────────────────────────────── */
    :host {
      --fire: #e67e22;
      --ember: #c0392b;
      --surface: #0f0c08;
      --panel: #181410;
      --panel2: #201c16;
      --border: rgba(230,126,34,0.15);
      --border2: rgba(230,126,34,0.07);
      --text: #f0e6d8;
      --muted: rgba(240,230,216,0.4);
      --mono: 'Courier New', monospace;
    }

    /* ── ROOT ────────────────────────────────── */
    .oh-root {
      min-height: 100vh;
      background: var(--surface);
      position: relative; overflow-x: hidden;
      font-family: 'DM Sans', sans-serif;
      color: var(--text);
    }
    .grid-bg {
      position: fixed; inset: 0;
      background-image:
        linear-gradient(rgba(230,126,34,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(230,126,34,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none; z-index: 0;
    }
    .orb {
      position: fixed; border-radius: 50%;
      filter: blur(140px); pointer-events: none; z-index: 0;
    }
    .orb1 {
      width: 600px; height: 600px;
      background: rgba(230,126,34,0.08);
      bottom: -250px; left: -150px;
    }

    /* ── INNER ───────────────────────────────── */
    .oh-inner {
      position: relative; z-index: 1;
      max-width: 1200px; margin: 0 auto;
      padding: 56px 40px 80px;
    }

    /* ── PAGE HEAD ───────────────────────────── */
    .ph-eyebrow {
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.15em; color: var(--fire);
      font-family: var(--mono); margin-bottom: 8px;
    }
    .page-head { margin-bottom: 44px; }
    .ph-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(44px, 5vw, 68px);
      font-weight: 900; line-height: 0.92;
      color: var(--text); margin-bottom: 14px;
    }
    .ph-title em { font-style: normal; color: var(--fire); }
    .ph-sub { font-size: 14px; color: var(--muted); }

    /* ── SEARCH ──────────────────────────────── */
    .search-block {
      display: flex; gap: 12px;
      margin-bottom: 8px;
    }
    .sb-input-wrap {
      flex: 1; display: flex; align-items: center;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 6px; overflow: hidden;
      transition: border-color 0.25s;
    }
    .sb-input-wrap:focus-within { border-color: var(--fire); }
    .sb-prefix {
      padding: 0 16px;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.1em; color: var(--fire);
      font-family: var(--mono);
      border-right: 1px solid var(--border);
      height: 100%; display: flex; align-items: center;
    }
    .sb-input {
      flex: 1; padding: 16px 18px;
      font-size: 14px; background: transparent;
      border: none; outline: none;
      color: var(--text); font-family: var(--mono);
    }
    .sb-input::placeholder { color: rgba(240,230,216,0.2); }
    .sb-clear {
      padding: 0 14px; background: none; border: none;
      color: var(--muted); cursor: pointer; font-size: 14px;
      transition: color 0.2s;
    }
    .sb-clear:hover { color: #ef4444; }

    .search-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 24px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text); cursor: pointer;
      font-size: 12px; font-weight: 700;
      letter-spacing: 0.1em; font-family: var(--mono);
      transition: border-color 0.2s, background 0.2s;
      white-space: nowrap;
    }
    .search-btn:hover:not(:disabled) {
      border-color: var(--fire);
      background: rgba(230,126,34,0.06);
    }
    .search-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .sbtn-icon { color: var(--fire); font-size: 15px; }

    .search-hint { font-size: 11px; color: var(--muted); font-family: var(--mono); margin-bottom: 28px; }

    /* Error */
    .err-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 6px; font-size: 13px; color: #fca5a5;
      margin-bottom: 24px; font-family: var(--mono);
    }
    .err-tag {
      padding: 2px 8px;
      background: rgba(239,68,68,0.2);
      border-radius: 3px; font-size: 10px; color: #ef4444; font-weight: 700;
    }

    /* ── RESULT ──────────────────────────────── */
    .result-area { display: flex; flex-direction: column; gap: 24px; }

    /* Status header */
    .status-header {
      display: flex; gap: 24px;
      padding: 24px 28px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      flex-wrap: wrap;
    }
    .sh-approved { border-top: 2px solid #22c55e; }
    .sh-rejected { border-top: 2px solid #ef4444; }
    .sh-pending  { border-top: 2px solid #f59e0b; }
    .sh-processing { border-top: 2px solid var(--fire); }

    .sh-left {
      display: flex; align-items: center; gap: 18px;
      min-width: 200px;
    }
    .sh-glyph {
      width: 52px; height: 52px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-family: var(--mono); font-weight: 900;
      flex-shrink: 0;
    }
    .sh-approved .sh-glyph { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .sh-rejected .sh-glyph { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .sh-pending  .sh-glyph { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .sh-processing .sh-glyph { background: rgba(230,126,34,0.12); color: var(--fire); border: 1px solid rgba(230,126,34,0.3); }

    .sh-eyebrow {
      display: block; font-size: 10px; font-weight: 700;
      letter-spacing: 0.14em; color: var(--muted); font-family: var(--mono); margin-bottom: 4px;
    }
    .sh-status {
      font-family: var(--mono); font-size: 22px; font-weight: 700;
      color: var(--text); margin: 0;
    }

    .sh-meta {
      display: flex; gap: 24px; flex-wrap: wrap; align-items: center; flex: 1;
    }
    .sm-field { display: flex; flex-direction: column; gap: 4px; }
    .smf-key {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.12em; color: var(--muted); font-family: var(--mono);
    }
    .smf-val {
      font-size: 13px; color: var(--text); font-weight: 500;
    }
    .smf-val.mono { font-family: var(--mono); font-size: 12px; word-break: break-all; }

    /* Steps section */
    .steps-section { display: flex; flex-direction: column; gap: 20px; }

    /* Chart block */
    .chart-block {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .cb-head {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border2);
    }
    .cb-label {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.14em; color: var(--fire); font-family: var(--mono);
    }
    .curve-container {
      padding: 16px;
      background: rgba(255,255,255,0.01);
      overflow-x: auto;
    }
    .curve-container canvas { width: 100%; height: auto; display: block; max-width: 800px; margin: 0 auto; }

    /* Bars block */
    .bars-block {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .bb-head {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border2);
    }
    .bb-label {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.14em; color: var(--fire); font-family: var(--mono);
    }
    .bar-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

    .bar-item {
      display: grid;
      grid-template-columns: 200px 1fr 100px;
      align-items: center;
      gap: 14px;
    }
    @media (max-width: 700px) { .bar-item { grid-template-columns: 1fr; gap: 6px; } }

    .bi-meta { display: flex; align-items: center; gap: 8px; overflow: hidden; }
    .bi-num { font-family: var(--mono); font-size: 10px; color: var(--muted); flex-shrink: 0; }
    .bi-name { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bi-svc { font-size: 10px; color: var(--muted); flex-shrink: 0; font-family: var(--mono); }

    .bi-track {
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 3px; overflow: hidden;
    }
    .bi-fill {
      height: 100%; border-radius: 3px;
      transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .fill-completed   { background: #22c55e; }
    .fill-running     { background: var(--fire); animation: bar-pulse 1.5s infinite; }
    .fill-failed      { background: #ef4444; }
    .fill-compensated { background: #f59e0b; }
    .fill-pending     { background: rgba(255,255,255,0.12); }
    @keyframes bar-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .bi-chip {
      display: inline-flex; justify-content: center;
      padding: 3px 8px; border-radius: 3px;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.06em; font-family: var(--mono);
    }
    .chip-completed   { background: rgba(34,197,94,0.12); color: #22c55e; }
    .chip-running     { background: rgba(230,126,34,0.12); color: var(--fire); }
    .chip-failed      { background: rgba(239,68,68,0.12); color: #ef4444; }
    .chip-compensated { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .chip-pending     { background: rgba(255,255,255,0.06); color: var(--muted); }

    /* Step grid */
    .step-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px;
    }

    .step-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px 20px;
      display: flex; flex-direction: column; gap: 8px;
      transition: transform 0.2s, border-color 0.25s;
    }
    .step-card:hover { transform: translateY(-2px); }
    .sc-completed   { border-top: 2px solid #22c55e; }
    .sc-running     { border-top: 2px solid var(--fire); }
    .sc-failed      { border-top: 2px solid #ef4444; }
    .sc-compensated { border-top: 2px solid #f59e0b; }
    .sc-pending     { border-top: 2px solid rgba(255,255,255,0.1); }

    .scd-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .scd-num { font-family: var(--mono); font-size: 10px; color: var(--muted); }
    .scd-title { font-size: 14px; font-weight: 700; color: var(--text); margin: 0; flex: 1; min-width: 0; }
    .scd-svc {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.08em; color: var(--muted);
      background: rgba(255,255,255,0.05);
      padding: 2px 8px; border-radius: 3px; font-family: var(--mono);
    }
    .scd-action { font-size: 13px; font-weight: 600; color: rgba(240,230,216,0.65); margin: 0; }
    .scd-desc   { font-size: 12px; color: var(--muted); line-height: 1.5; margin: 0; }
    .scd-err {
      font-size: 12px; color: #fca5a5;
      padding: 6px 10px;
      background: rgba(239,68,68,0.08);
      border-radius: 4px; font-family: var(--mono);
    }
    .err-tag {
      display: inline-block; padding: 1px 6px;
      background: rgba(239,68,68,0.2); border-radius: 2px;
      font-size: 9px; color: #ef4444; margin-right: 6px;
    }
    .scd-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
    .scd-status {
      display: inline-flex; padding: 3px 9px;
      border-radius: 3px; font-size: 10px; font-weight: 700;
      letter-spacing: 0.06em; font-family: var(--mono);
    }
    .sts-completed   { background: rgba(34,197,94,0.12); color: #22c55e; }
    .sts-running     { background: rgba(230,126,34,0.12); color: var(--fire); }
    .sts-failed      { background: rgba(239,68,68,0.12); color: #ef4444; }
    .sts-compensated { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .sts-pending     { background: rgba(255,255,255,0.06); color: var(--muted); }
    .scd-ts { font-size: 11px; color: var(--muted); font-family: var(--mono); }

    /* Idle / not found */
    .idle-state, .not-found {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 80px 24px; color: var(--muted); text-align: center;
    }
    .is-glyph { animation: float 4s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    .nf-glyph {
      font-size: 56px; font-family: var(--mono); font-weight: 900;
      color: rgba(240,230,216,0.15);
    }
    .idle-state h3, .not-found h3 {
      font-family: 'Playfair Display', serif;
      font-size: 24px; color: rgba(240,230,216,0.6); margin: 0;
    }
    .idle-state p, .not-found p { font-size: 13px; font-family: var(--mono); margin: 0; }

    @media (max-width: 700px) {
      .oh-inner { padding: 36px 20px 60px; }
      .search-block { flex-direction: column; }
      .search-btn { justify-content: center; }
    }
  `]
})
export class OrderHistoryComponent implements AfterViewInit {
  @ViewChild('curveCanvas') curveCanvas!: ElementRef<HTMLCanvasElement>;

  searchOrderId = '';
  orderStatus: any = null;
  loading = false;
  error = '';
  searchPerformed = false;
  String = String;

  private readonly STATUS_COLORS: Record<string, string> = {
    completed:   '#22c55e',
    running:     '#e67e22',
    failed:      '#ef4444',
    compensated: '#f59e0b',
    pending:     'rgba(255,255,255,0.2)',
  };

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {}
  ngAfterViewInit() {}

  fmt(ts: number) { return ts ? new Date(ts).toLocaleString() : 'N/A'; }

  statusGlyph(s: string) {
    return { APPROVED: '✓', REJECTED: '✕', PENDING: '○', PROCESSING: '◎', CANCELLED: '⊘' }[s?.toUpperCase()] ?? '?';
  }

  barWidth(i: number, total: number): number {
    if (total <= 1) return 100;
    return Math.round(20 + (80 / (total - 1)) * i);
  }

  clearSearch() {
    this.searchOrderId = '';
    this.orderStatus = null;
    this.error = '';
    this.searchPerformed = false;
  }

  searchOrder() {
    if (!this.searchOrderId.trim()) { this.error = 'Please enter an Order ID'; return; }
    this.loading = true;
    this.error = '';
    this.searchPerformed = true;
    this.orderStatus = null;

    this.orderService.getOrderStatus(this.searchOrderId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.orderStatus = res;
          this.cdr.detectChanges();
          setTimeout(() => this.drawCurve(), 80);
        } else {
          this.error = 'Order not found';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to fetch order status';
        this.cdr.detectChanges();
      }
    });
  }

  private drawCurve() {
    if (!this.curveCanvas) return;
    const canvas = this.curveCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const steps: any[] = this.orderStatus?.data?.steps ?? [];
    if (steps.length === 0) return;

    const W = canvas.width, H = canvas.height;
    const PAD = { top: 20, bottom: 32, left: 16, right: 16 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    ctx.fillRect(0, 0, W, H);

    const STATUS_ORDER: Record<string, number> = { pending: 0, running: 1, compensated: 2, failed: 3, completed: 4 };
    const maxY = 4;
    const n = steps.length;

    // Grid lines
    for (let lvl = 0; lvl <= maxY; lvl++) {
      const y = PAD.top + chartH - (lvl / maxY) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.strokeStyle = 'rgba(230,126,34,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const pts = steps.map((s, i) => ({
      x: PAD.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW),
      y: PAD.top + chartH - ((STATUS_ORDER[s.status] ?? 0) / maxY) * chartH,
      status: s.status,
      label: s.label,
    }));

    // Fill under curve
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, PAD.top + chartH);
      ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const cx1 = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(cx1, pts[i - 1].y, cx1, pts[i].y, pts[i].x, pts[i].y);
      }
      ctx.lineTo(pts[pts.length - 1].x, PAD.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
      grad.addColorStop(0, 'rgba(230,126,34,0.2)');
      grad.addColorStop(1, 'rgba(230,126,34,0.01)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Curve line
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const cx1 = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(cx1, pts[i - 1].y, cx1, pts[i].y, pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Points
    pts.forEach((p) => {
      const color = this.STATUS_COLORS[p.status] ?? '#e67e22';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color + '22';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#181410';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(240,230,216,0.55)';
      ctx.font = '11px Courier New, monospace';
      ctx.textAlign = 'center';
      const label = p.label.length > 10 ? p.label.slice(0, 10) + '…' : p.label;
      ctx.fillText(label, p.x, PAD.top + chartH + 22);
    });
  }
}