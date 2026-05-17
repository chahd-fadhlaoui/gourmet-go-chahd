import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="order-history-container">
      <div class="history-card">
        <h2>Order History</h2>
        
        <div class="search-section">
          <input 
            type="text" 
            [(ngModel)]="searchOrderId" 
            placeholder="Search by Order ID"
            class="search-input"
          />
          <button (click)="searchOrder()" class="btn-search">
            Search
          </button>
        </div>

        <div *ngIf="error" class="alert alert-error">
          {{ error }}
        </div>

        <div *ngIf="loading" class="loading">
          Loading...
        </div>

        <div *ngIf="orderStatus && !loading" class="order-details">
          <h3>Order Status</h3>
          <p><strong>Order ID:</strong> {{ orderStatus.data.orderId }}</p>
          <p><strong>Current Status:</strong> {{ orderStatus.data.status }}</p>
          <p><strong>Latest Event:</strong> {{ orderStatus.data.lastEvent }}</p>
          <p><strong>Retrieved at:</strong> {{ formatTimestamp(orderStatus.timestamp) }}</p>
          <!-- Actions removed: show only order status when searching by ID -->
        </div>
        <!-- Detailed history hidden from search results; use dedicated History page if needed -->

        <div *ngIf="!searchPerformed && !loading" class="info-message">
          Enter an order ID to search for order details.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-history-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .history-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 100%;
      margin-top: 20px;
    }

    h2 {
      color: #333;
      margin-bottom: 30px;
      text-align: center;
      font-size: 28px;
    }

    .search-section {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .search-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-search {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-search:hover {
      background: #764ba2;
    }

    .alert {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .alert-error {
      background-color: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .loading {
      text-align: center;
      color: #666;
      padding: 20px;
    }

    .order-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 4px;
      border: 1px solid #eee;
    }

    .order-details h3 {
      margin-top: 0;
      color: #333;
    }

    .order-details p {
      margin: 10px 0;
      color: #666;
    }

    .info-message {
      text-align: center;
      color: #999;
      padding: 30px;
      font-style: italic;
    }
  `]
})
export class OrderHistoryComponent {
  searchOrderId: string = '';
  orderStatus: any = null;
  loading: boolean = false;
  error: string = '';
  searchPerformed: boolean = false;
  orderHistory: any = null;

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  formatTimestamp(timestamp: number): string {
    if (!timestamp) {
      return 'N/A';
    }
    return new Date(timestamp).toLocaleString();
  }

  searchOrder() {
    if (!this.searchOrderId.trim()) {
      this.error = 'Please enter an Order ID';
      this.orderStatus = null;
      return;
    }

    this.loading = true;
    this.error = '';
    this.searchPerformed = true;
    this.orderStatus = null;

    this.orderService.getOrderStatus(this.searchOrderId).subscribe({
      next: (response) => {
        this.loading = false;
        this.orderStatus = response;
        if (!response.success) {
          this.error = 'Order not found';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to fetch order status';
        this.orderStatus = null;
        this.cdr.detectChanges();
      }
    });
  }
 

  loadHistory() {
    if (!this.searchOrderId.trim()) return;
    this.orderHistory = null;
    this.loading = true;
    this.orderService.getOrderHistory(this.searchOrderId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.orderHistory = res.data;
        else this.error = res.message || 'Failed to load history';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to load history';
        this.cdr.detectChanges();
      }
    });
  }

  cancelOrder() {
    if (!this.searchOrderId.trim()) return;
    this.loading = true;
    this.orderService.cancelOrder(this.searchOrderId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.orderStatus = res;
        else this.error = res.message || 'Failed to cancel order';
        this.searchOrder();
        this.loadHistory();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to cancel order';
        this.cdr.detectChanges();
      }
    });
  }

  retryOrder() {
    if (!this.searchOrderId.trim()) return;
    this.loading = true;
    this.orderService.retryOrder(this.searchOrderId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.orderStatus = res;
        else this.error = res.message || 'Retry failed';
        this.searchOrder();
        this.loadHistory();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Retry failed';
        this.cdr.detectChanges();
      }
    });
  }
}
