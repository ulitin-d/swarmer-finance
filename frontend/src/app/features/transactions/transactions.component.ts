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
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
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
