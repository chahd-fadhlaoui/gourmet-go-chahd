import { Routes } from '@angular/router';
import { CreateOrderComponent } from './components/create-order/create-order.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';

export const routes: Routes = [
  { path: '', redirectTo: '/create', pathMatch: 'full' },
  { path: 'create', component: CreateOrderComponent },
  { path: 'history', component: OrderHistoryComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '/create' }
];
