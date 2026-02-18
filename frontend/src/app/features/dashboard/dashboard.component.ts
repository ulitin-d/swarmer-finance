import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService, Summary } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CurrencyPipe, DatePipe, AsyncPipe } from '@angular/common';
import { Observable, of, catchError, startWith } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TuiButton, CurrencyPipe, DatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <h1>Dashboard</h1>
        <div class="user-info">
          <span>{{ authService.user()?.email }}</span>
          <button tuiButton appearance="flat" size="s" (click)="authService.logout()">
            Logout
          </button>
        </div>
      </header>

      <nav class="nav-links">
        <a routerLink="/transactions" class="nav-link">
          <button tuiButton size="l">Transactions</button>
        </a>
        <a routerLink="/categories" class="nav-link">
          <button tuiButton appearance="secondary" size="l">Categories</button>
        </a>
      </nav>

      <div class="card summary-card">
        <h2>Current Month Summary</h2>
        @if (loading()) {
          <div class="loading">Loading...</div>
        } @else if (summary(); as s) {
          <div class="period">
            {{ s.period.from | date:'mediumDate' }} - {{ s.period.to | date:'mediumDate' }}
          </div>
          <div class="summary-grid">
            <div class="summary-item income">
              <span class="label">Income</span>
              <span class="amount">{{ s.income | currency }}</span>
            </div>
            <div class="summary-item expense">
              <span class="label">Expenses</span>
              <span class="amount">{{ s.expense | currency }}</span>
            </div>
            <div class="summary-item balance" [class.negative]="s.balance < 0">
              <span class="label">Balance</span>
              <span class="amount">{{ s.balance | currency }}</span>
            </div>
          </div>
        } @else {
          <p>Unable to load summary</p>
          <button tuiButton (click)="loadSummary()">Retry</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 28px; }
    .user-info { display: flex; align-items: center; gap: 16px; }
    .nav-links { display: flex; gap: 16px; margin-bottom: 24px; }
    .nav-link button { width: 100%; }
    .summary-card h2 { margin: 0 0 16px; font-size: 20px; }
    .period { color: #666; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .summary-item { padding: 20px; border-radius: 8px; text-align: center; }
    .summary-item .label { display: block; font-size: 14px; color: #666; margin-bottom: 8px; }
    .summary-item .amount { font-size: 24px; font-weight: 600; }
    .summary-item.income { background: rgba(34, 197, 94, 0.1); }
    .summary-item.income .amount { color: #22c55e; }
    .summary-item.expense { background: rgba(239, 68, 68, 0.1); }
    .summary-item.expense .amount { color: #ef4444; }
    .summary-item.balance { background: rgba(59, 130, 246, 0.1); }
    .summary-item.balance .amount { color: #3b82f6; }
    .summary-item.balance.negative .amount { color: #ef4444; }
    .loading { padding: 20px; text-align: center; color: #666; }
    @media (max-width: 768px) { .summary-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(ApiService);

  summary = signal<Summary | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.loading.set(true);
    this.apiService.getSummary().subscribe({
      next: (response) => {
        this.summary.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
