import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  parent_id: number | null;
  color: string;
  icon: string;
  children?: Category[];
}

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  period: { from: string; to: string };
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Categories
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>('/api/categories');
  }

  createCategory(data: { name: string; parentId: number; color?: string; icon?: string }): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>('/api/categories', data);
  }

  updateCategory(id: number, data: { name?: string; color?: string; icon?: string }): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`/api/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.delete<ApiResponse<{ success: boolean }>>(`/api/categories/${id}`);
  }

  // Transactions
  getTransactions(filters?: {
    from?: string;
    to?: string;
    category?: number;
    type?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<TransactionListResponse>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<TransactionListResponse>>('/api/transactions', { params });
  }

  createTransaction(data: {
    categoryId: number;
    amount: number;
    date: string;
    description?: string;
  }): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>('/api/transactions', data);
  }

  updateTransaction(id: number, data: {
    categoryId?: number;
    amount?: number;
    date?: string;
    description?: string;
  }): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(`/api/transactions/${id}`, data);
  }

  deleteTransaction(id: number): Observable<ApiResponse<{ success: boolean }>> {
    return this.http.delete<ApiResponse<{ success: boolean }>>(`/api/transactions/${id}`);
  }

  // Summary
  getSummary(): Observable<ApiResponse<Summary>> {
    return this.http.get<ApiResponse<Summary>>('/api/summary');
  }
}
