import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService, Summary } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TuiButton, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
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
