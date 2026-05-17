import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
  timestamp: number;
}

export interface CreateOrderRequest {
  amount: number;
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  amount: number;
}

export interface OrderStatusResponse {
  orderId: string;
  status: string;
  lastEvent: string;
  lastUpdatedAt: number;
  sagaFlow?: string;
  steps?: SagaStep[];
}

export interface SagaStep {
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

export interface OrderHistoryEntry {
  event: string;
  detail: string;
  timestamp: number;
}

export interface OrderHistory {
  orderId: string;
  events: OrderHistoryEntry[];
}

export interface WorkflowOrder {
  orderId: string;
  status: string;
  createdAt: number;
}

export interface WorkflowTicket {
  orderId: string;
  status: string;
  createdAt: number;
}

export interface WorkflowPayment {
  orderId: string;
  amount: number;
  authorized: boolean;
  createdAt: number;
}

export interface WorkflowOverview {
  statusCounts: { [key: string]: number };
  orders: WorkflowOrder[];
  tickets: WorkflowTicket[];
  payments: WorkflowPayment[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = '/api/orders';

  constructor(private http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<ApiResponse<CreateOrderResponse>> {
    return this.http.post<ApiResponse<CreateOrderResponse>>(this.apiUrl, request);
  }

  getOrderStatus(orderId: string): Observable<ApiResponse<OrderStatusResponse>> {
    return this.http.get<ApiResponse<OrderStatusResponse>>(`${this.apiUrl}/${orderId}`);
  }

  getAllOrders(): Observable<ApiResponse<WorkflowOrder[]>> {
    return this.http.get<ApiResponse<WorkflowOrder[]>>(this.apiUrl);
  }

  cancelOrder(orderId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${orderId}`);
  }

  getOrderHistory(orderId: string): Observable<ApiResponse<OrderHistory>> {
    return this.http.get<ApiResponse<OrderHistory>>(`${this.apiUrl}/${orderId}/history`);
  }

  retryOrder(orderId: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${orderId}/retry`, {});
  }

  getDashboard(): Observable<ApiResponse<WorkflowOverview>> {
    return this.http.get<ApiResponse<WorkflowOverview>>(`${this.apiUrl}/dashboard`);
  }

  getWorkflowOverview(): Observable<ApiResponse<WorkflowOverview>> {
    return this.http.get<ApiResponse<WorkflowOverview>>(`${this.apiUrl}/workflow`);
  }
}
