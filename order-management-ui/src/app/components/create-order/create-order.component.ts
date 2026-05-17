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
    <div class="saga-container">
      <!-- Modern Header with Gradient -->
      <header class="saga-header">
        <div class="header-content">
          <div class="header-title-group">
            <h1 class="header-title">🍽️ Gourmet-Go</h1>
            <p class="header-subtitle">Distributed Order Management via Saga Orchestration</p>
          </div>
          <div class="header-badge" [class]="'badge-' + (currentSession ? 'active' : 'idle')">
            {{ currentSession ? '⚡ LIVE' : '○ READY' }}
          </div>
        </div>
      </header>

      <main class="saga-main">
        <!-- Left Panel: Order Creation Form -->
        <section class="form-panel">
          <div class="card form-card">
            <div class="card-header">
              <h2>Create Order</h2>
              <span class="card-badge">Step 1</span>
            </div>

            <div class="form-description">
              <p>Submit an order amount to trigger the distributed saga:</p>
              <ul>
                <li><strong>Amount ≤ $100</strong> → Auto-approved (Happy Path)</li>
                <li><strong>Amount > $100</strong> → Auto-rejected (Compensation Path)</li>
              </ul>
            </div>

            <form (ngSubmit)="submitOrder()" class="order-form">
              <div class="form-field">
                <label for="order-amount">Order Amount</label>
                <div class="input-container">
                  <span class="input-prefix">$</span>
                  <input 
                    id="order-amount"
                    type="number" 
                    [(ngModel)]="amount" 
                    name="amount"
                    step="0.01"
                    min="1"
                    max="9999"
                    placeholder="0.00"
                    [disabled]="loading"
                    class="amount-input"
                  />
                </div>
                <div class="input-helper">
                  <span class="helper-hint">💡 Try amounts: $50 (approved), $150 (rejected)</span>
                </div>
              </div>

              <button 
                type="submit"
                class="submit-button"
                [disabled]="loading || amount <= 0"
                [class.loading]="loading"
              >
                <span class="button-icon">{{ loading ? '⏳' : '🚀' }}</span>
                <span class="button-text">{{ loading ? 'Processing Order...' : 'Execute Order' }}</span>
              </button>
            </form>

            <!-- Error Alert -->
            <div *ngIf="error" class="error-banner" @slideIn>
              <span class="error-icon">⚠️</span>
              <div class="error-content">
                <p class="error-title">Order Creation Failed</p>
                <p class="error-message">{{ error }}</p>
              </div>
              <button class="error-close" (click)="error = ''">✕</button>
            </div>

            <!-- Quick Stats -->
            <div *ngIf="currentSession" class="quick-stats">
              <div class="stat">
                <span class="stat-label">Order ID</span>
                <span class="stat-value mono">{{ currentSession.orderId | slice:0:8 }}...</span>
              </div>
              <div class="stat">
                <span class="stat-label">Amount</span>
                <span class="stat-value">\${{ currentSession.amount | number:'1.2-2' }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Decision</span>
                <span class="stat-value" [class]="'decision-' + currentSession.finalStatus.toLowerCase()">
                  {{ currentSession.finalStatus || 'Processing...' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Right Panel: Saga Timeline Visualization -->
        <section class="timeline-panel">
          <!-- State Indicator -->
          <div *ngIf="!currentSession" class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No Active Order</h3>
            <p>Create an order to see the saga workflow in action</p>
            
            <div class="workflow-guide">
              <h4>🎯 How It Works</h4>
              <div class="guide-grid">
                <div class="guide-path happy-path">
                  <div class="path-icon">✅</div>
                  <div class="path-title">Happy Path</div>
                  <ol class="path-steps">
                    <li>Order Created</li>
                    <li>Kitchen Ticket Created</li>
                    <li>Payment Approved</li>
                    <li>Order Finalized</li>
                  </ol>
                </div>
                <div class="guide-path failure-path">
                  <div class="path-icon">🔄</div>
                  <div class="path-title">Compensation Path</div>
                  <ol class="path-steps">
                    <li>Order Created</li>
                    <li>Kitchen Ticket Created</li>
                    <li>Payment Failed</li>
                    <li>Compensation Triggered</li>
                    <li>Ticket Rolled Back</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Timeline -->
          <div *ngIf="currentSession" class="timeline-active">
            <!-- Progress Header -->
            <div class="timeline-header">
              <h2>Saga Execution Flow</h2>
              <div class="flow-indicator">
                <span class="flow-label">{{ getFlowLabel(currentSession.sagaFlow) }}</span>
                <span class="flow-dot" [class]="'dot-' + currentSession.sagaFlow.toLowerCase()"></span>
              </div>
            </div>

            <!-- Final Status Banner -->
            <div 
              *ngIf="currentSession.finalStatus" 
              class="status-banner"
              [class]="'banner-' + currentSession.finalStatus.toLowerCase()"
              @slideDown
            >
              <div class="banner-icon">{{ currentSession.finalStatus === 'APPROVED' ? '✅' : '❌' }}</div>
              <div class="banner-content">
                <h3>{{ currentSession.finalStatus === 'APPROVED' ? 'Order Approved' : 'Order Rejected' }}</h3>
                <p>
                  {{ currentSession.finalStatus === 'APPROVED' 
                    ? 'All services executed successfully. The order is ready for fulfillment.'
                    : 'Payment failed. Compensation logic rolled back all completed steps.' }}
                </p>
              </div>
            </div>

            <!-- Timeline Stepper -->
            <div class="timeline-stepper">
              <div 
                *ngFor="let step of currentSession.workflowSteps; let i = index; let last = last"
                class="stepper-item"
                [class]="'step-' + step.status"
                [class.step-current]="isCurrentStep(i)"
              >
                <!-- Connector Line -->
                <div *ngIf="!last" class="stepper-connector" [class]="'connector-' + step.status"></div>

                <!-- Step Circle -->
                <div class="step-circle">
                  <div class="circle-content">
                    {{ getStepIcon(step.status) }}
                  </div>
                </div>

                <!-- Step Content -->
                <div class="step-detail">
                  <div class="detail-header">
                    <h3 class="step-title">{{ step.label }}</h3>
                    <span class="service-badge">{{ step.service }}</span>
                  </div>
                  
                  <p class="step-action">{{ step.action }}</p>
                  <p class="step-description">{{ step.description }}</p>

                  <!-- Error Message -->
                  <div *ngIf="step.errorMessage" class="error-detail">
                    <span class="error-prefix">Error:</span> {{ step.errorMessage }}
                  </div>

                  <!-- Status Badge -->
                  <div class="status-badge" [class]="'badge-' + step.status">
                    {{ getStatusLabel(step.status) }}
                  </div>

                  <!-- Timestamp -->
                  <div *ngIf="step.timestamp" class="step-time">
                    {{ formatTime(step.timestamp) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Processing Info -->
            <div *ngIf="!currentSession.finalStatus" class="processing-info">
              <div class="processing-dot"></div>
              <span>Processing saga steps...</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    .saga-container {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f4c75 100%);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      color: #1e293b;
    }

    /* ============================================
       HEADER SECTION
       ============================================ */
    .saga-header {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%);
      border-bottom: 1px solid rgba(100, 150, 255, 0.2);
      padding: 40px 32px;
      backdrop-filter: blur(10px);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
    }

    .header-title-group {
      flex: 1;
    }

    .header-title {
      font-size: 42px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      font-size: 16px;
      color: #cbd5e1;
      margin: 0;
      font-weight: 400;
    }

    .header-badge {
      padding: 12px 20px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.1em;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .badge-idle {
      background: rgba(100, 116, 139, 0.2);
      color: #94a3b8;
    }

    .badge-active {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.3);
    }

    /* ============================================
       MAIN LAYOUT
       ============================================ */
    .saga-main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 32px;
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 40px;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .saga-main {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }

    /* ============================================
       CARDS & PANELS
       ============================================ */
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.8);
      animation: cardSlideIn 0.5s ease-out;
    }

    @keyframes cardSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f5f9;
    }

    .card h2 {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .card-badge {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    /* ============================================
       FORM PANEL
       ============================================ */
    .form-panel {
      display: flex;
      flex-direction: column;
    }

    .form-card {
      display: flex;
      flex-direction: column;
    }

    .form-description {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .form-description p {
      margin: 0 0 12px 0;
    }

    .form-description ul {
      margin: 0;
      padding-left: 20px;
      color: #475569;
    }

    .form-description li {
      margin: 8px 0;
    }

    .order-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 24px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-field label {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-prefix {
      position: absolute;
      left: 16px;
      font-size: 18px;
      font-weight: 700;
      color: #64748b;
      pointer-events: none;
    }

    .amount-input {
      width: 100%;
      padding: 14px 16px 14px 36px;
      font-size: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      color: #0f172a;
      font-weight: 500;
      transition: all 0.3s ease;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .amount-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      background: #f8fafc;
    }

    .amount-input:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .input-helper {
      font-size: 12px;
      color: #94a3b8;
      padding: 0 4px;
    }

    .helper-hint {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .submit-button {
      padding: 14px 20px;
      font-size: 16px;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      font-size: 14px;
    }

    .submit-button:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
    }

    .submit-button:active:not(:disabled) {
      transform: translateY(-1px);
    }

    .submit-button:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .submit-button.loading {
      background: linear-gradient(90deg, #3b82f6, #1e40af, #3b82f6);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .button-icon {
      font-size: 18px;
      display: inline-block;
    }

    .button-text {
      display: block;
    }

    /* ============================================
       ERROR BANNER
       ============================================ */
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 10px;
      margin-top: 16px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      font-size: 13px;
      font-weight: 700;
      color: #7f1d1d;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .error-message {
      font-size: 14px;
      color: #991b1b;
      margin: 0;
      line-height: 1.4;
    }

    .error-close {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .error-close:hover {
      opacity: 1;
    }

    /* ============================================
       QUICK STATS
       ============================================ */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding-top: 16px;
      border-top: 2px solid #f1f5f9;
      margin-top: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }

    .stat-value.mono {
      font-family: 'Monaco', monospace;
      font-size: 13px;
    }

    .decision-approved {
      color: #16a34a;
      background: #dcfce7;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .decision-rejected {
      color: #dc2626;
      background: #fee2e2;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .decision-processing {
      color: #3b82f6;
      background: #dbeafe;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* ============================================
       TIMELINE PANEL
       ============================================ */
    .timeline-panel {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      min-height: 600px;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255, 255, 255, 0.8);
      animation: cardSlideIn 0.5s ease-out;
    }

    /* ============================================
       EMPTY STATE
       ============================================ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .empty-state h3 {
      font-size: 24px;
      color: #0f172a;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 16px;
      margin: 0 0 32px 0;
      color: #94a3b8;
    }

    .workflow-guide {
      text-align: left;
      width: 100%;
      margin-top: 24px;
    }

    .workflow-guide h4 {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 16px 0;
    }

    .guide-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .guide-path {
      padding: 16px;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      transition: all 0.3s;
    }

    .happy-path {
      border-left: 4px solid #16a34a;
    }

    .happy-path .path-icon {
      color: #16a34a;
    }

    .failure-path {
      border-left: 4px solid #f59e0b;
    }

    .failure-path .path-icon {
      color: #f59e0b;
    }

    .path-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .path-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 8px 0;
    }

    .path-steps {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }

    .path-steps li {
      margin: 6px 0;
    }

    /* ============================================
       TIMELINE ACTIVE
       ============================================ */
    .timeline-active {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f5f9;
    }

    .timeline-header h2 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }

    .flow-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 20px;
    }

    .flow-label {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .flow-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    .dot-happy_path {
      background: #16a34a;
    }

    .dot-compensation_path {
      background: #f59e0b;
    }

    .dot-in_progress {
      background: #3b82f6;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    /* ============================================
       STATUS BANNER
       ============================================ */
    .status-banner {
      padding: 20px;
      border-radius: 12px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      animation: slideDown 0.4s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .banner-approved {
      background: #ecfdf5;
      border: 2px solid #10b981;
    }

    .banner-rejected {
      background: #fef2f2;
      border: 2px solid #ef4444;
    }

    .banner-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .banner-content h3 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .banner-content p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
      line-height: 1.4;
    }

    /* ============================================
       TIMELINE STEPPER
       ============================================ */
    .timeline-stepper {
      display: flex;
      flex-direction: column;
      gap: 2px;
      position: relative;
    }

    .stepper-item {
      display: grid;
      grid-template-columns: 60px 1fr;
      gap: 20px;
      position: relative;
      padding: 16px;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .stepper-item::before {
      content: '';
      position: absolute;
      left: 29px;
      top: 60px;
      width: 2px;
      height: calc(100% + 2px);
      background: #e2e8f0;
      pointer-events: none;
    }

    .stepper-item:last-child::before {
      display: none;
    }

    .step-pending::before { background: #cbd5e1; }
    .step-running::before { background: #3b82f6; }
    .step-completed::before { background: #10b981; }
    .step-failed::before { background: #ef4444; }
    .step-compensated::before { background: #f59e0b; }

    .stepper-item.step-running {
      background: rgba(59, 130, 246, 0.05);
      border-left: 3px solid #3b82f6;
    }

    .stepper-item.step-completed {
      background: rgba(16, 185, 129, 0.05);
    }

    .stepper-item.step-failed {
      background: rgba(239, 68, 68, 0.05);
      border-left: 3px solid #ef4444;
    }

    .stepper-item.step-compensated {
      background: rgba(245, 158, 11, 0.05);
    }

    .stepper-connector {
      grid-column: 1 / 2;
      position: relative;
    }

    .step-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: white;
      border: 3px solid #e2e8f0;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
      transition: all 0.3s ease;
    }

    .step-pending .step-circle {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .step-running .step-circle {
      background: #dbeafe;
      border-color: #3b82f6;
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
      animation: pulse-circle 2s ease-in-out infinite;
    }

    @keyframes pulse-circle {
      0%, 100% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1); }
      50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.05); }
    }

    .step-completed .step-circle {
      background: #dcfce7;
      border-color: #10b981;
    }

    .step-failed .step-circle {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .step-compensated .step-circle {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .step-detail {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 4px;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .step-title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .service-badge {
      padding: 4px 10px;
      border-radius: 20px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .step-action {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }

    .step-description {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }

    .error-detail {
      padding: 8px 12px;
      background: #fef2f2;
      border-left: 2px solid #ef4444;
      border-radius: 4px;
      font-size: 12px;
      color: #b91c1c;
    }

    .error-prefix {
      font-weight: 700;
    }

    .status-badge {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: fit-content;
    }

    .badge-pending {
      background: #f1f5f9;
      color: #64748b;
    }

    .badge-running {
      background: #dbeafe;
      color: #1e40af;
      animation: pulse-badge 1.5s ease-in-out infinite;
    }

    @keyframes pulse-badge {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .badge-completed {
      background: #dcfce7;
      color: #15803d;
    }

    .badge-failed {
      background: #fee2e2;
      color: #b91c1c;
    }

    .badge-compensated {
      background: #fef3c7;
      color: #92400e;
    }

    .step-time {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* ============================================
       PROCESSING INFO
       ============================================ */
    .processing-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px;
      background: #f0f9ff;
      border-radius: 12px;
      color: #0369a1;
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
    }

    .processing-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #0369a1;
      animation: dot-pulse 1.5s ease-in-out infinite;
    }

    @keyframes dot-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
    }

    /* ============================================
       RESPONSIVE
       ============================================ */
    @media (max-width: 768px) {
      .saga-header {
        padding: 24px 16px;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .header-title {
        font-size: 28px;
      }

      .saga-main {
        padding: 24px 16px;
        gap: 24px;
      }

      .card {
        padding: 24px;
      }

      .timeline-stepper {
        gap: 12px;
      }

      .stepper-item {
        grid-template-columns: 48px 1fr;
        gap: 12px;
        padding: 12px;
      }

      .step-circle {
        width: 48px;
        height: 48px;
        font-size: 20px;
      }

      .guide-grid {
        grid-template-columns: 1fr;
      }

      .quick-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CreateOrderComponent implements OnInit, OnDestroy {
  amount: number = 0;
  loading = false;
  error = '';
  currentSession: OrderSession | null = null;
  private destroy$ = new Subject<void>();
  private pollInterval: any;

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  submitOrder() {
    if (this.amount <= 0) {
      this.error = 'Order amount must be greater than $0';
      return;
    }

    this.loading = true;
    this.error = '';

    this.orderService.createOrder({ amount: this.amount })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.orderId) {
            this.currentSession = {
              orderId: response.data.orderId,
              amount: this.amount,
              scenario: 'backend-driven',
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

      this.orderService.getOrderStatus(this.currentSession!.orderId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.data) {
              const status = response.data.status;
              this.currentSession!.sagaFlow = response.data.sagaFlow || 'IN_PROGRESS';
              this.currentSession!.workflowSteps = (response.data.steps || []).map((step: SagaStep) => ({
                id: step.id,
                label: step.label,
                service: step.service,
                action: step.action,
                description: step.description,
                status: step.status,
                icon: step.icon,
                timestamp: step.timestamp,
                errorMessage: step.errorMessage
              }));

              // Find the current active step
              let activeStepIndex = this.currentSession!.workflowSteps.length - 1;
              for (let i = 0; i < this.currentSession!.workflowSteps.length; i++) {
                if (this.currentSession!.workflowSteps[i].status === 'running') {
                  activeStepIndex = i;
                  break;
                }
              }
              this.currentSession!.currentStep = Math.max(0, activeStepIndex);
              this.cdr.detectChanges();

              if (status === 'APPROVED' || status === 'REJECTED') {
                clearInterval(this.pollInterval);
                this.loading = false;
                this.currentSession!.finalStatus = status;
                this.currentSession!.completedAt = Date.now();
                this.cdr.detectChanges();
              }
            }
          },
          error: () => {
            // Continue polling silently on error
            if (pollCount >= maxPolls) {
              clearInterval(this.pollInterval);
            }
          }
        });
    }, 800);

    // Safety timeout: stop polling after 30 seconds
    setTimeout(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
      if (this.currentSession && !this.currentSession.finalStatus) {
        this.loading = false;
        this.error = 'Order processing timed out. Please refresh and try again.';
        this.cdr.detectChanges();
      }
    }, 30000);
  }

  isCurrentStep(index: number): boolean {
    return this.currentSession ? index === this.currentSession.currentStep : false;
  }

  getStepIcon(status: string): string {
    switch (status) {
      case 'pending':
        return '◯';
      case 'running':
        return '⟳';
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'compensated':
        return '↻';
      default:
        return '?';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'compensated':
        return 'Rolled Back';
      default:
        return status;
    }
  }

  getFlowLabel(flow: string): string {
    switch (flow) {
      case 'HAPPY_PATH':
        return '✓ Happy Path';
      case 'COMPENSATION_PATH':
        return '↻ Compensation Path';
      case 'IN_PROGRESS':
        return '⟳ Processing...';
      default:
        return 'Unknown';
    }
  }

  formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  }
}