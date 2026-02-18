import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { ApiService, Category, Transaction } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [ReactiveFormsModule, TuiButton, CurrencyPipe, DatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <h1>Transactions</h1>
        <button tuiButton (click)="openDialog()">Add Transaction</button>
      </header>

      <div class="filters card">
        <div class="filter-row">
          <div class="filter-item">
            <label>From</label>
            <input type="date" [formControl]="filterFrom" class="form-input">
          </div>
          <div class="filter-item">
            <label>To</label>
            <input type="date" [formControl]="filterTo" class="form-input">
          </div>
          <button tuiButton appearance="flat" (click)="loadTransactions()">Apply</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (transactions().length > 0) {
        <div class="transactions-list">
          @for (tx of transactions(); track tx.id) {
            <div class="transaction-item card">
              <div class="tx-category" [style.border-color]="tx.category_color">
                <span class="category-name">{{ tx.category_name }}</span>
              </div>
              <div class="tx-details">
                <span class="tx-amount" [class.expense]="tx.amount < 0" [class.income]="tx.amount > 0">
                  {{ tx.amount | currency }}
                </span>
                <span class="tx-date">{{ tx.date | date:'mediumDate' }}</span>
                @if (tx.description) {
                  <span class="tx-description">{{ tx.description }}</span>
                }
              </div>
              <div class="tx-actions">
                <button tuiButton appearance="flat" size="s" (click)="openDialog(tx)">Edit</button>
                <button tuiButton appearance="flat" size="s" (click)="deleteTransaction(tx.id)">Delete</button>
              </div>
            </div>
          }
        </div>
      } @else {
        <p class="empty-state">No transactions found</p>
      }

      @if (showDialog()) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog card" (click)="$event.stopPropagation()">
            <h2>{{ editingTransaction() ? 'Edit' : 'Add' }} Transaction</h2>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>Amount</label>
                <input type="number" formControlName="amount" class="form-input" step="0.01">
              </div>
              <div class="form-group">
                <label>Category</label>
                <select formControlName="categoryId" class="form-input">
                  <option [value]="null">Select category</option>
                  @for (cat of leafCategories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Date</label>
                <input type="date" formControlName="date" class="form-input">
              </div>
              <div class="form-group">
                <label>Description</label>
                <input type="text" formControlName="description" class="form-input" placeholder="Description (optional)">
              </div>
              <div class="dialog-actions">
                <button tuiButton appearance="flat" type="button" (click)="closeDialog()">Cancel</button>
                <button tuiButton type="submit" [disabled]="form.invalid">{{ editingTransaction() ? 'Update' : 'Create' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 28px; }
    .filters { margin-bottom: 24px; }
    .filter-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
    .filter-item { flex: 1; min-width: 150px; }
    .filter-item label { display: block; margin-bottom: 4px; font-size: 14px; color: #666; }
    .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: #526ed3; }
    .transactions-list { display: flex; flex-direction: column; gap: 12px; }
    .transaction-item { display: flex; align-items: center; gap: 16px; padding: 16px; }
    .tx-category { width: 4px; height: 48px; border-left: 4px solid; border-radius: 2px; }
    .tx-details { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .category-name { font-weight: 500; }
    .tx-date { font-size: 14px; color: #666; }
    .tx-description { font-size: 14px; color: #666; }
    .tx-amount { font-size: 18px; font-weight: 600; }
    .tx-amount.income { color: #22c55e; }
    .tx-amount.expense { color: #ef4444; }
    .tx-actions { display: flex; gap: 8px; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 24px; }
    .dialog h2 { margin: 0 0 24px; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #666; }
    .empty-state { text-align: center; color: #666; padding: 48px; }
    .loading { padding: 20px; text-align: center; color: #666; }
  `]
})
export class TransactionsComponent implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(ApiService);

  form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
    date: new FormControl<string | null>(null, [Validators.required]),
    description: new FormControl<string>('', [])
  });

  filterFrom = new FormControl<string | null>(null);
  filterTo = new FormControl<string | null>(null);

  categories = signal<Category[]>([]);
  transactions = signal<Transaction[]>([]);
  showDialog = signal(false);
  editingTransaction = signal<Transaction | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.loadCategories();
    this.loadTransactions();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (response) => {
        if (response.data) this.categories.set(response.data);
      }
    });
  }

  loadTransactions() {
    this.loading.set(true);
    const filters: Record<string, string | number | undefined> = {};
    if (this.filterFrom.value) filters['from'] = this.filterFrom.value;
    if (this.filterTo.value) filters['to'] = this.filterTo.value;
    
    this.apiService.getTransactions(filters).subscribe({
      next: (response) => {
        if (response.data) this.transactions.set(response.data.transactions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  leafCategories = () => {
    const cats = this.categories();
    const getLeafIds = (items: Category[]): number[] => {
      return items.flatMap(item => {
        if (item.children?.length) return getLeafIds(item.children);
        return [item.id];
      });
    };
    return getLeafIds(cats).map(id => cats.find(c => c.id === id)).filter(Boolean) as Category[];
  };

  openDialog(tx?: Transaction) {
    if (tx) {
      this.editingTransaction.set(tx);
      this.form.patchValue({ 
        amount: tx.amount, 
        categoryId: tx.category_id, 
        date: tx.date, 
        description: tx.description 
      });
    } else {
      this.editingTransaction.set(null);
      this.form.reset();
      const today = new Date().toISOString().split('T')[0];
      this.form.patchValue({ date: today });
    }
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
    this.editingTransaction.set(null);
    this.form.reset();
  }

  onSubmit() {
    if (this.form.invalid) return;
    const { amount, categoryId, date, description } = this.form.value;
    const editing = this.editingTransaction();
    const desc = description || undefined;
    
    const request = editing
      ? this.apiService.updateTransaction(editing.id, { 
          amount: amount!, 
          categoryId: categoryId!, 
          date: date!, 
          description: desc 
        })
      : this.apiService.createTransaction({ 
          amount: amount!, 
          categoryId: categoryId!, 
          date: date!, 
          description: desc 
        });
    request.subscribe({ 
      next: () => { 
        this.closeDialog(); 
        this.loadTransactions(); 
      }, 
      error: console.error 
    });
  }

  deleteTransaction(id: number) {
    if (!confirm('Delete this transaction?')) return;
    this.apiService.deleteTransaction(id).subscribe({ 
      next: () => this.loadTransactions(), 
      error: console.error 
    });
  }
}
