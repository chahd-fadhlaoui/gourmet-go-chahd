import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService, SagaStep } from '../../services/order.service';

interface WorkflowStep {
  id: string;
  label: string;
  service: string;
  action: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensated';
  icon: string;
  timestamp?: number;
  errorMessage?: string;
}

interface OrderSession {
  orderId: string;
  amount: number;
  scenario?: string;
  currentStep: number;
  workflowSteps: WorkflowStep[];
  sagaFlow: string;
  finalStatus: string;
  createdAt?: number;
  completedAt?: number;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="co-root">
      <!-- Ambient grid bg -->
      <div class="grid-bg" aria-hidden="true"></div>
      <div class="orb orb1" aria-hidden="true"></div>
      <div class="orb orb2" aria-hidden="true"></div>

      <div class="co-wrap">

        <!-- ════ LEFT COLUMN — FORM ════ -->
        <div class="left-col">

          <!-- Page tag -->
          <div class="page-tag">
            <span class="tag-dot"></span>
            SAGA ORCHESTRATOR
          </div>

          <h1 class="headline">
            Place<br><em>Order</em>
          </h1>

          <p class="subline">Trigger a distributed saga workflow across microservices.</p>

          <!-- Rules -->
          <div class="rule-stack">
            <div class="rule-row">
              <div class="rule-icon ok">✓</div>
              <div>
                <span class="rule-val">≤ $100</span>
                <span class="rule-txt">Happy Path — auto-approved</span>
              </div>
            </div>
            <div class="rule-row">
              <div class="rule-icon fail">✕</div>
              <div>
                <span class="rule-val">&gt; $100</span>
                <span class="rule-txt">Compensation — rollback triggered</span>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div class="form-block">
            <label class="form-label">ORDER AMOUNT</label>
            <div class="input-row">
              <span class="currency">$</span>
              <input
                type="number"
                [(ngModel)]="amount"
                name="amount"
                step="0.01" min="1" max="9999"
                placeholder="0.00"
                [disabled]="loading"
                class="amount-field"
              />
            </div>
            <p class="hint-line">Try $50 for approval · $150 for rejection</p>

            <button
              class="exec-btn"
              (click)="submitOrder()"
              [disabled]="loading || amount <= 0"
              [class.is-loading]="loading"
            >
              <span class="btn-inner">
                <span class="btn-icon">{{ loading ? '◌' : '▶' }}</span>
                <span>{{ loading ? 'EXECUTING…' : 'EXECUTE ORDER' }}</span>
              </span>
              <span class="btn-track"></span>
            </button>
          </div>

          <!-- Error -->
          <div *ngIf="error" class="err-strip">
            <span class="err-prefix">ERR</span>
            {{ error }}
            <button class="err-close" (click)="error=''">✕</button>
          </div>

          <!-- Order badge -->
          <div *ngIf="currentSession" class="order-badge">
            <div class="ob-row">
              <span class="ob-key">ORDER ID</span>
              <span class="ob-val mono">{{ currentSession.orderId | slice:0:12 }}…</span>
            </div>
            <div class="ob-divider"></div>
            <div class="ob-row">
              <span class="ob-key">AMOUNT</span>
              <span class="ob-val">{{ '$' + (currentSession.amount | number:'1.2-2') }}</span>
            </div>
            <div class="ob-divider"></div>
            <div class="ob-row">
              <span class="ob-key">DECISION</span>
              <span class="ob-val status-chip"
                [class.chip-ok]="currentSession.finalStatus === 'APPROVED'"
                [class.chip-fail]="currentSession.finalStatus === 'REJECTED'"
                [class.chip-pending]="!currentSession.finalStatus"
              >
                {{ currentSession.finalStatus || 'PROCESSING' }}
              </span>
            </div>
          </div>

        </div>

        <!-- ════ RIGHT COLUMN — TIMELINE ════ -->
        <div class="right-col">

          <!-- Empty state -->
          <div *ngIf="!currentSession" class="empty-state">
            <div class="es-hex">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <polygon points="40,4 74,22 74,58 40,76 6,58 6,22" fill="none" stroke="rgba(230,126,34,0.3)" stroke-width="1.5"/>
                <polygon points="40,14 66,28 66,52 40,66 14,52 14,28" fill="none" stroke="rgba(230,126,34,0.15)" stroke-width="1"/>
                <text x="40" y="47" text-anchor="middle" font-size="26" fill="#e67e22">🍕</text>
              </svg>
            </div>
            <h3>Awaiting Dispatch</h3>
            <p>No active saga — submit an order to begin.</p>
            <div class="path-preview">
              <div class="pp-col">
                <span class="pp-label">HAPPY PATH</span>
                <div class="pp-steps">
                  <span>Create</span>
                  <span class="pp-arr">→</span>
                  <span>Kitchen</span>
                  <span class="pp-arr">→</span>
                  <span>Payment</span>
                  <span class="pp-arr">→</span>
                  <span>Finalize</span>
                </div>
              </div>
              <div class="pp-col">
                <span class="pp-label">COMPENSATION</span>
                <div class="pp-steps">
                  <span>Create</span>
                  <span class="pp-arr">→</span>
                  <span>Kitchen</span>
                  <span class="pp-arr">→</span>
                  <span class="pp-fail">Reject</span>
                  <span class="pp-arr">→</span>
                  <span class="pp-fail">Rollback</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Active timeline -->
          <div *ngIf="currentSession" class="timeline-live">

            <!-- TL Header -->
            <div class="tl-top">
              <div>
                <span class="tl-eyebrow">SAGA FLOW</span>
                <h2 class="tl-title">{{ currentSession.orderId | slice:0:8 }}<span class="tl-ellipsis">…</span></h2>
              </div>
              <div class="flow-pill" [class]="'fp-' + currentSession.sagaFlow.toLowerCase()">
                <span class="fp-pulse"></span>
                {{ getFlowLabel(currentSession.sagaFlow) }}
              </div>
            </div>

            <!-- Result banner -->
            <div *ngIf="currentSession.finalStatus" class="result-strip"
                 [class.rs-ok]="currentSession.finalStatus === 'APPROVED'"
                 [class.rs-fail]="currentSession.finalStatus === 'REJECTED'">
              <span class="rs-glyph">{{ currentSession.finalStatus === 'APPROVED' ? '✓' : '✕' }}</span>
              <div>
                <strong>{{ currentSession.finalStatus === 'APPROVED' ? 'Order Approved' : 'Order Rejected' }}</strong>
                <p>{{ currentSession.finalStatus === 'APPROVED'
                    ? 'All saga steps completed successfully. Bon appétit! 🍕'
                    : 'Payment declined — compensation triggered, all steps rolled back.' }}</p>
              </div>
            </div>

            <!-- Steps -->
            <div class="steps-track">
              <div
                *ngFor="let step of currentSession.workflowSteps; let i = index; let last = last"
                class="step-node"
                [class]="'sn-' + step.status"
                [class.sn-active]="isCurrentStep(i)"
              >
                <!-- Connector line -->
                <div class="step-line" *ngIf="!last" [class]="'sl-' + step.status"></div>

                <!-- Marker -->
                <div class="step-marker">
                  <span class="sm-glyph">{{ getStepIcon(step.status) }}</span>
                  <span *ngIf="step.status === 'running'" class="sm-ring"></span>
                </div>

                <!-- Content card -->
                <div class="step-card">
                  <div class="sc-top">
                    <span class="sc-num">{{ padNum(i + 1) }}</span>
                    <h4 class="sc-title">{{ step.label }}</h4>
                    <span class="sc-svc">{{ step.service }}</span>
                    <span class="sc-badge" [class]="'sb-' + step.status">{{ getStatusLabel(step.status) }}</span>
                  </div>
                  <p class="sc-action">{{ step.action }}</p>
                  <p class="sc-desc">{{ step.description }}</p>
                  <div *ngIf="step.errorMessage" class="sc-err">
                    <span class="err-tag">ERR</span> {{ step.errorMessage }}
                  </div>
                  <span *ngIf="step.timestamp" class="sc-ts">{{ formatTime(step.timestamp) }}</span>
                </div>
              </div>
            </div>

            <!-- Processing ticker -->
            <div *ngIf="!currentSession.finalStatus" class="ticker">
              <span class="tick-dot d1"></span>
              <span class="tick-dot d2"></span>
              <span class="tick-dot d3"></span>
              <span class="tick-label">Executing saga…</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── TOKENS ─────────────────────────────── */
    :host {
      --fire: #e67e22;
      --ember: #c0392b;
      --gold: #f39c12;
      --ink: #0d0804;
      --surface: #141008;
      --panel: #1c1610;
      --border: rgba(230,126,34,0.18);
      --text: #f0e6d8;
      --muted: rgba(240,230,216,0.45);
      --mono: 'Courier New', monospace;
    }

    /* ── ROOT ────────────────────────────────── */
    .co-root {
      min-height: 100vh;
      background: var(--surface);
      position: relative;
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      color: var(--text);
    }

    /* Grid background */
    .grid-bg {
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(230,126,34,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(230,126,34,0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
      z-index: 0;
    }

    /* Orbs */
    .orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
      z-index: 0;
    }
    .orb1 { width: 600px; height: 600px; background: rgba(192,57,43,0.12); top: -200px; left: -150px; }
    .orb2 { width: 500px; height: 500px; background: rgba(230,126,34,0.08); bottom: -200px; right: -100px; }

    /* ── WRAPPER ─────────────────────────────── */
    .co-wrap {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 420px 1fr;
      min-height: 100vh;
      gap: 0;
    }

    @media (max-width: 1100px) { .co-wrap { grid-template-columns: 1fr; } }

    /* ── LEFT COLUMN ─────────────────────────── */
    .left-col {
      padding: 56px 48px;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .page-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--fire);
      font-family: var(--mono);
    }
    .tag-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--fire);
      animation: blink 1.5s step-end infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

    .headline {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(52px, 6vw, 76px);
      font-weight: 900;
      line-height: 0.92;
      color: var(--text);
      margin: 0;
    }
    .headline em {
      font-style: normal;
      color: var(--fire);
      -webkit-text-stroke: 0px;
    }

    .subline {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.6;
      margin: 0;
    }

    /* Rules */
    .rule-stack {
      display: flex;
      flex-direction: column;
      gap: 1px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .rule-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: rgba(255,255,255,0.025);
      transition: background 0.2s;
    }
    .rule-row:hover { background: rgba(255,255,255,0.04); }
    .rule-icon {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .rule-icon.ok   { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .rule-icon.fail { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .rule-val { display: block; font-size: 14px; font-weight: 700; color: var(--text); font-family: var(--mono); }
    .rule-txt { display: block; font-size: 12px; color: var(--muted); margin-top: 2px; }

    /* Form block */
    .form-block { display: flex; flex-direction: column; gap: 10px; }
    .form-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--muted);
      font-family: var(--mono);
    }
    .input-row {
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      transition: border-color 0.25s;
    }
    .input-row:focus-within { border-color: var(--fire); }
    .currency {
      padding: 0 16px;
      font-size: 22px;
      font-weight: 700;
      color: var(--muted);
      font-family: var(--mono);
      border-right: 1px solid var(--border);
    }
    .amount-field {
      flex: 1;
      padding: 16px 18px;
      font-size: 28px;
      font-weight: 800;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      font-family: var(--mono);
    }
    .amount-field::placeholder { color: rgba(240,230,216,0.2); }
    .amount-field:disabled { opacity: 0.4; cursor: not-allowed; }

    .hint-line { font-size: 11px; color: rgba(240,230,216,0.3); font-family: var(--mono); }

    /* Execute button */
    .exec-btn {
      position: relative;
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.25s, transform 0.2s;
    }
    .exec-btn:hover:not(:disabled) {
      border-color: var(--fire);
      transform: translateY(-1px);
    }
    .exec-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 18px 28px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--text);
      font-family: var(--mono);
      position: relative;
      z-index: 1;
    }
    .btn-icon { font-size: 16px; color: var(--fire); }
    .btn-track {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(230,126,34,0.08), transparent);
      background-size: 200% 100%;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .exec-btn:hover:not(:disabled) .btn-track { opacity: 1; }
    .exec-btn.is-loading .btn-track {
      opacity: 1;
      animation: scan 1.4s linear infinite;
    }
    @keyframes scan { from{background-position:200% 0} to{background-position:-200% 0} }

    /* Error */
    .err-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 6px;
      font-size: 13px;
      color: #fca5a5;
      font-family: var(--mono);
    }
    .err-prefix {
      padding: 2px 8px;
      background: rgba(239,68,68,0.2);
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      color: #ef4444;
      flex-shrink: 0;
    }
    .err-strip p { flex: 1; margin: 0; }
    .err-close {
      background: none; border: none; cursor: pointer; color: #ef4444;
      font-size: 14px; padding: 0; margin-left: auto; flex-shrink: 0;
    }

    /* Order badge */
    .order-badge {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: rgba(255,255,255,0.02);
    }
    .ob-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 18px;
    }
    .ob-divider { height: 1px; background: var(--border); }
    .ob-key {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--muted);
      font-family: var(--mono);
    }
    .ob-val {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }
    .ob-val.mono { font-family: var(--mono); font-size: 12px; color: var(--muted); }
    .status-chip {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      font-family: var(--mono);
    }
    .chip-ok      { background: rgba(34,197,94,0.15); color: #22c55e; }
    .chip-fail    { background: rgba(239,68,68,0.15); color: #ef4444; }
    .chip-pending { background: rgba(230,126,34,0.15); color: var(--fire); animation: pulse-chip 1.5s infinite; }
    @keyframes pulse-chip { 0%,100%{opacity:1} 50%{opacity:0.6} }

    /* ── RIGHT COLUMN ────────────────────────── */
    .right-col {
      padding: 56px 48px;
      overflow-y: auto;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding-top: 60px;
    }
    .es-hex { opacity: 0.7; animation: float 5s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    .empty-state h3 { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--text); margin: 0; }
    .empty-state > p { color: var(--muted); font-size: 14px; margin: 0; }

    .path-preview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
      max-width: 520px;
      margin-top: 12px;
    }
    .pp-col {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 18px;
      background: rgba(255,255,255,0.02);
    }
    .pp-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--fire);
      font-family: var(--mono);
      margin-bottom: 10px;
    }
    .pp-steps {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 6px;
      align-items: center;
      font-size: 12px;
      color: var(--muted);
    }
    .pp-arr { color: rgba(230,126,34,0.4); }
    .pp-fail { color: #ef4444; }

    /* Timeline live */
    .timeline-live {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* TL top */
    .tl-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }
    .tl-eyebrow {
      display: block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--fire);
      font-family: var(--mono);
      margin-bottom: 4px;
    }
    .tl-title {
      font-family: var(--mono);
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }
    .tl-ellipsis { opacity: 0.4; }

    /* Flow pill */
    .flow-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      font-family: var(--mono);
      border: 1px solid;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .fp-happy_path   { background: rgba(34,197,94,0.1); color: #22c55e; border-color: rgba(34,197,94,0.3); }
    .fp-compensation_path { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .fp-in_progress  { background: rgba(230,126,34,0.1); color: var(--fire); border-color: rgba(230,126,34,0.3); }
    .fp-pulse {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: blink 1.5s step-end infinite;
    }

    /* Result strip */
    .result-strip {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 18px 22px;
      border-radius: 8px;
      border: 1px solid;
      animation: slide-in 0.35s ease-out;
    }
    @keyframes slide-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    .rs-ok   { background: rgba(34,197,94,0.07); border-color: rgba(34,197,94,0.25); }
    .rs-fail { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.25); }
    .rs-glyph {
      font-size: 22px;
      font-weight: 900;
      font-family: var(--mono);
      flex-shrink: 0;
    }
    .rs-ok .rs-glyph   { color: #22c55e; }
    .rs-fail .rs-glyph { color: #ef4444; }
    .result-strip strong { display: block; font-size: 14px; color: var(--text); margin-bottom: 4px; }
    .result-strip p { font-size: 13px; color: var(--muted); margin: 0; }

    /* Steps track */
    .steps-track {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .step-node {
      display: grid;
      grid-template-columns: 56px 1fr;
      gap: 20px;
      position: relative;
      padding-bottom: 28px;
    }
    .step-node:last-child { padding-bottom: 0; }

    /* Connector line — left of marker */
    .step-line {
      position: absolute;
      left: 27px;
      top: 52px;
      bottom: 0;
      width: 2px;
      background: var(--border);
    }
    .sl-completed { background: rgba(34,197,94,0.35); }
    .sl-running   { background: rgba(230,126,34,0.35); }
    .sl-failed    { background: rgba(239,68,68,0.35); }
    .sl-compensated { background: rgba(245,158,11,0.35); }

    /* Marker */
    .step-marker {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--panel);
      border: 2px solid var(--border);
      font-size: 18px;
      font-family: var(--mono);
      position: relative;
      flex-shrink: 0;
      z-index: 1;
      transition: border-color 0.3s;
    }
    .sn-pending   .step-marker { color: var(--muted); }
    .sn-running   .step-marker { border-color: var(--fire); color: var(--fire); }
    .sn-completed .step-marker { border-color: #22c55e; color: #22c55e; }
    .sn-failed    .step-marker { border-color: #ef4444; color: #ef4444; }
    .sn-compensated .step-marker { border-color: #f59e0b; color: #f59e0b; }

    .sm-ring {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid transparent;
      border-top-color: var(--fire);
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Step card */
    .step-card {
      background: rgba(255,255,255,0.025);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      transition: border-color 0.25s;
    }
    .sn-running   .step-card { border-color: rgba(230,126,34,0.35); }
    .sn-completed .step-card { border-color: rgba(34,197,94,0.2); }
    .sn-failed    .step-card { border-color: rgba(239,68,68,0.25); }
    .sn-compensated .step-card { border-color: rgba(245,158,11,0.25); }

    .sc-top {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .sc-num {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
    }
    .sc-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      flex: 1;
      min-width: 0;
    }
    .sc-svc {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--muted);
      padding: 2px 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 3px;
      font-family: var(--mono);
    }
    .sc-badge {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 3px 9px;
      border-radius: 3px;
      font-family: var(--mono);
    }
    .sb-pending     { background: rgba(255,255,255,0.05); color: var(--muted); }
    .sb-running     { background: rgba(230,126,34,0.15); color: var(--fire); animation: pulse-chip 1.5s infinite; }
    .sb-completed   { background: rgba(34,197,94,0.12); color: #22c55e; }
    .sb-failed      { background: rgba(239,68,68,0.12); color: #ef4444; }
    .sb-compensated { background: rgba(245,158,11,0.12); color: #f59e0b; }

    .sc-action { font-size: 13px; font-weight: 600; color: rgba(240,230,216,0.7); margin: 0; }
    .sc-desc   { font-size: 12px; color: var(--muted); margin: 0; line-height: 1.5; }

    .sc-err {
      font-size: 12px;
      color: #fca5a5;
      padding: 6px 10px;
      background: rgba(239,68,68,0.08);
      border-radius: 4px;
      font-family: var(--mono);
    }
    .err-tag {
      display: inline-block;
      padding: 1px 6px;
      background: rgba(239,68,68,0.2);
      border-radius: 2px;
      font-size: 9px;
      color: #ef4444;
      margin-right: 6px;
    }

    .sc-ts { font-size: 11px; color: rgba(240,230,216,0.2); font-family: var(--mono); }

    /* Ticker */
    .ticker {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border: 1px solid rgba(230,126,34,0.15);
      border-radius: 6px;
      background: rgba(230,126,34,0.04);
    }
    .tick-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--fire);
      animation: dot-pulse 1.2s ease-in-out infinite;
    }
    .d1 { animation-delay: 0s; }
    .d2 { animation-delay: 0.2s; }
    .d3 { animation-delay: 0.4s; }
    @keyframes dot-pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
    .tick-label { font-size: 12px; color: var(--fire); font-family: var(--mono); letter-spacing: 0.08em; }

    @media (max-width: 1100px) {
      .left-col, .right-col { padding: 36px 24px; }
      .co-wrap { grid-template-columns: 1fr; }
      .left-col { border-right: none; border-bottom: 1px solid var(--border); }
    }
  `]
})
export class CreateOrderComponent implements OnInit, OnDestroy {
  amount: number = 0;
  loading = false;
  error = '';
  currentSession: OrderSession | null = null;
  padNum = (n: number) => String(n).padStart(2, '0');
  private destroy$ = new Subject<void>();
  private pollInterval: any;

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {}
  ngOnInit() {}
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  submitOrder() {
    if (this.amount <= 0) { this.error = 'Order amount must be greater than $0'; return; }
    this.loading = true;
    this.error = '';
    this.orderService.createOrder({ amount: this.amount }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.data?.orderId) {
          this.currentSession = {
            orderId: response.data.orderId,
            amount: this.amount,
            currentStep: 0,
            sagaFlow: 'IN_PROGRESS',
            finalStatus: '',
            createdAt: Date.now(),
            workflowSteps: []
          };
          this.pollOrderStatus();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to create order. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  private pollOrderStatus() {
    if (!this.currentSession) return;
    let pollCount = 0;
    const maxPolls = 30;
    this.pollInterval = setInterval(() => {
      pollCount++;
      this.orderService.getOrderStatus(this.currentSession!.orderId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          if (response.data) {
            this.currentSession!.sagaFlow = response.data.sagaFlow || 'IN_PROGRESS';
            this.currentSession!.workflowSteps = (response.data.steps || []).map((s: SagaStep) => ({
              id: s.id, label: s.label, service: s.service, action: s.action,
              description: s.description, status: s.status, icon: s.icon,
              timestamp: s.timestamp, errorMessage: s.errorMessage
            }));
            let active = this.currentSession!.workflowSteps.length - 1;
            for (let i = 0; i < this.currentSession!.workflowSteps.length; i++) {
              if (this.currentSession!.workflowSteps[i].status === 'running') { active = i; break; }
            }
            this.currentSession!.currentStep = Math.max(0, active);
            this.cdr.detectChanges();
            const status = response.data.status;
            if (status === 'APPROVED' || status === 'REJECTED') {
              clearInterval(this.pollInterval);
              this.loading = false;
              this.currentSession!.finalStatus = status;
              this.currentSession!.completedAt = Date.now();
              this.cdr.detectChanges();
            }
          }
        },
        error: () => { if (pollCount >= maxPolls) clearInterval(this.pollInterval); }
      });
    }, 800);
    setTimeout(() => {
      if (this.pollInterval) clearInterval(this.pollInterval);
      if (this.currentSession && !this.currentSession.finalStatus) {
        this.loading = false;
        this.error = 'Order processing timed out.';
        this.cdr.detectChanges();
      }
    }, 30000);
  }

  isCurrentStep(i: number): boolean { return this.currentSession ? i === this.currentSession.currentStep : false; }

  getStepIcon(s: string) { return { pending: '○', running: '◎', completed: '●', failed: '✕', compensated: '↻' }[s] ?? '?'; }
  getStatusLabel(s: string) { return { pending: 'PENDING', running: 'RUNNING', completed: 'DONE', failed: 'FAILED', compensated: 'ROLLED BACK' }[s] ?? s.toUpperCase(); }
  getFlowLabel(f: string) { return { HAPPY_PATH: 'HAPPY PATH', COMPENSATION_PATH: 'COMPENSATION', IN_PROGRESS: 'IN PROGRESS' }[f] ?? 'UNKNOWN'; }

  formatTime(ts: number): string {
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60) return `${d}s ago`;
    const m = Math.floor(d / 60);
    if (m < 60) return `${m}m ago`;
    return new Date(ts).toLocaleTimeString();
  }
}