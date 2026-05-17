import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <!-- ── NAVBAR ─────────────────────────────────────────── -->
      <nav class="navbar">
        <div class="nav-inner">
          <!-- Brand -->
          <a routerLink="/create" class="brand">
            <div class="pizza-logo">
              <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                <!-- Pizza slice shape -->
                <g>
                  <!-- crust -->
                  <path d="M32 4 C32 4 58 52 32 60 C6 52 32 4 32 4Z" fill="#e67e22"/>
                  <!-- cheese -->
                  <path d="M32 12 C32 12 52 50 32 56 C12 50 32 12 32 12Z" fill="#f1c40f"/>
                  <!-- sauce blobs -->
                  <circle cx="32" cy="28" r="4" fill="#c0392b" opacity="0.85"/>
                  <circle cx="26" cy="38" r="3" fill="#c0392b" opacity="0.85"/>
                  <circle cx="38" cy="38" r="3" fill="#c0392b" opacity="0.85"/>
                  <!-- pepperoni -->
                  <circle cx="32" cy="22" r="2.5" fill="#922b21"/>
                  <circle cx="27" cy="34" r="2" fill="#922b21"/>
                  <circle cx="37" cy="34" r="2" fill="#922b21"/>
                  <!-- crust detail -->
                  <path d="M20 54 Q32 64 44 54" fill="none" stroke="#d35400" stroke-width="3" stroke-linecap="round"/>
                </g>
              </svg>
            </div>
            <div class="brand-text">
              <span class="brand-name">Gourmet<em>Go</em></span>
              <span class="brand-sub">Saga Orchestration</span>
            </div>
          </a>

          <!-- Links -->
          <ul class="nav-links">
            <li>
              <a routerLink="/create" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
                <span class="nav-icon">🚀</span> Create Order
              </a>
            </li>
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
                <span class="nav-icon">📊</span> Workflow Tables
              </a>
            </li>
            <li>
              <a routerLink="/history" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
                <span class="nav-icon">🔍</span> Order History
              </a>
            </li>
          </ul>

          <!-- Live badge -->
          <div class="live-pill">
            <span class="pulse-dot"></span> LIVE
          </div>
        </div>
      </nav>

      <!-- ── MAIN ───────────────────────────────────────────── -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- ── FOOTER ─────────────────────────────────────────── -->
      <footer class="footer">
        <p>© 2026 GourmetGo &nbsp;·&nbsp; Distributed Saga Pattern &nbsp;·&nbsp; Spring Boot + Angular</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: radial-gradient(ellipse at top, #3d0c00 0%, #1a0500 70%);
    }

    /* ── NAVBAR ─────────────────────────────────── */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(26,5,0,0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(231,76,60,0.25);
      box-shadow: 0 2px 24px rgba(192,57,43,0.3);
    }

    .nav-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      height: 72px;
      display: flex;
      align-items: center;
      gap: 40px;
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      flex-shrink: 0;
    }

    .pizza-logo {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #e74c3c, #e67e22);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(231,76,60,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .pizza-logo:hover { transform: rotate(-5deg) scale(1.05); }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.3px;
    }

    .brand-name em {
      font-style: italic;
      color: #f39c12;
    }

    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* Nav links */
    .nav-links {
      display: flex;
      list-style: none;
      gap: 4px;
      margin-left: auto;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255,248,240,0.7);
      text-decoration: none;
      transition: all 0.25s ease;
    }

    .nav-links a:hover {
      background: rgba(231,76,60,0.15);
      color: #fff8f0;
    }

    .nav-links a.active {
      background: linear-gradient(135deg, rgba(192,57,43,0.4), rgba(230,126,34,0.3));
      color: #f39c12;
      border: 1px solid rgba(243,156,18,0.3);
    }

    .nav-icon { font-size: 15px; }

    /* Live pill */
    .live-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(231,76,60,0.15);
      border: 1px solid rgba(231,76,60,0.3);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #f39c12;
      flex-shrink: 0;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #e74c3c;
      animation: pulse-live 2s ease-in-out infinite;
    }

    @keyframes pulse-live {
      0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(231,76,60,0.7); }
      50% { opacity:.7; box-shadow: 0 0 0 5px rgba(231,76,60,0); }
    }

    /* ── MAIN ───────────────────────────────────── */
    .main-content {
      flex: 1;
    }

    /* ── FOOTER ─────────────────────────────────── */
    .footer {
      background: rgba(26,5,0,0.95);
      border-top: 1px solid rgba(231,76,60,0.15);
      color: rgba(255,248,240,0.35);
      text-align: center;
      padding: 16px 20px;
      font-size: 12px;
      letter-spacing: 0.04em;
    }

    @media (max-width: 900px) {
      .nav-inner { padding: 0 16px; gap: 16px; }
      .brand-sub { display: none; }
      .live-pill { display: none; }
      .nav-links a { padding: 8px 10px; font-size: 13px; }
      .nav-links a span.nav-icon { display: none; }
    }

    @media (max-width: 600px) {
      .nav-inner { flex-wrap: wrap; height: auto; padding: 12px 16px; gap: 12px; }
      .nav-links { margin-left: 0; flex-wrap: wrap; }
    }
  `]
})
export class App {}