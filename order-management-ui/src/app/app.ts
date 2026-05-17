import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-container">
      <nav class="navbar">
        <div class="nav-brand">
          <h1>Order Management System</h1>
        </div>
        <ul class="nav-links">
          <li>
            <a 
              routerLink="/create" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              Create Order
            </a>
          </li>
          <li>
            <a 
              routerLink="/dashboard" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              Workflow Tables
            </a>
          </li>
          <li>
            <a 
              routerLink="/history" 
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              Order History
            </a>
          </li>
        </ul>
      </nav>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer">
        <p>© 2026 Order Management System | Saga workflow view powered by Spring Boot + Angular</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px 40px;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .nav-links {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 30px;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .nav-links a:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-links a.active {
      background: rgba(255, 255, 255, 0.2);
      border-bottom: 2px solid white;
    }

    .main-content {
      flex: 1;
      padding: 40px 20px;
    }

    .footer {
      background: #333;
      color: #ccc;
      text-align: center;
      padding: 20px;
      margin-top: auto;
      font-size: 14px;
    }

    .footer p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 20px;
      }

      .nav-brand h1 {
        text-align: center;
      }

      .nav-links {
        gap: 15px;
        justify-content: center;
      }
    }
  `]
})
export class App {
}
