import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { Transaction } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CategoriesState } from '../../core/categories.state';
import { TransactionsState } from '../../core/transactions.state';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TuiButton, CurrencyPipe, DatePipe],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  authService = inject(AuthService);
  categoriesState = inject(CategoriesState);
  transactionsState = inject(TransactionsState);

  form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
    date: new FormControl<string | null>(null, [Validators.required]),
    description: new FormControl<string>('', [])
  });

  filterFrom = new FormControl<string | null>(null);
  filterTo = new FormControl<string | null>(null);

  showDialog = signal(false);
  editingTransaction = signal<Transaction | null>(null);

  applyFilters() {
    const filters: { from?: string; to?: string } = {};
    if (this.filterFrom.value) filters.from = this.filterFrom.value;
    if (this.filterTo.value) filters.to = this.filterTo.value;
    this.transactionsState.setFilters(filters);
  }

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
      ? this.transactionsState.update(editing.id, {
          amount: amount!,
          categoryId: categoryId!,
          date: date!,
          description: desc
        })
      : this.transactionsState.create({
          amount: amount!,
          categoryId: categoryId!,
          date: date!,
          description: desc
        });
    request.subscribe({
      next: () => this.closeDialog(),
      error: console.error
    });
  }

  deleteTransaction(id: number) {
    if (!confirm('Delete this transaction?')) return;
    this.transactionsState.delete(id).subscribe({ error: console.error });
  }
}
