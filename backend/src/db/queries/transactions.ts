import { query, queryOne, execute } from '../index';
import { Transaction } from '../../types';

export interface TransactionFilters {
  from?: string;
  to?: string;
  category?: number;
  type?: 'income' | 'expense';
  page?: number;
  limit?: number;
}

export const getTransactionsByUserId = async (
  userId: number,
  filters: TransactionFilters
): Promise<{ transactions: Transaction[]; total: number }> => {
  const conditions: string[] = ['t.user_id = $1'];
  const params: unknown[] = [userId];
  let paramIndex = 2;
  
  if (filters.from) {
    conditions.push(`t.date >= $${paramIndex++}`);
    params.push(filters.from);
  }
  
  if (filters.to) {
    conditions.push(`t.date <= $${paramIndex++}`);
    params.push(filters.to);
  }
  
  if (filters.category) {
    conditions.push(`t.category_id = $${paramIndex++}`);
    params.push(filters.category);
  }
  
  const whereClause = conditions.join(' AND ');
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;
  
  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`,
    params
  );
  
  const transactions = await query<Transaction>(
    `SELECT t.*, c.name as category_name, c.color as category_color
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE ${whereClause}
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );
  
  return {
    transactions,
    total: parseInt(countResult[0]?.total || '0', 10),
  };
};

export const getTransactionById = async (
  id: number,
  userId: number
): Promise<Transaction | null> => {
  return queryOne<Transaction>(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
};

export const createTransaction = async (
  userId: number,
  categoryId: number,
  amount: number,
  date: string,
  description?: string
): Promise<Transaction> => {
  const result = await query<Transaction>(
    `INSERT INTO transactions (user_id, category_id, amount, date, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, categoryId, amount, date, description || '']
  );
  return result[0];
};

export const updateTransaction = async (
  id: number,
  userId: number,
  categoryId: number,
  amount: number,
  date: string,
  description?: string
): Promise<Transaction | null> => {
  const result = await query<Transaction>(
    `UPDATE transactions 
     SET category_id = $1, amount = $2, date = $3, description = $4
     WHERE id = $5 AND user_id = $6 RETURNING *`,
    [categoryId, amount, date, description || '', id, userId]
  );
  return result[0] || null;
};

export const deleteTransaction = async (
  id: number,
  userId: number
): Promise<boolean> => {
  const count = await execute(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return count > 0;
};

export const getSummaryByUserId = async (
  userId: number,
  from: string,
  to: string
): Promise<{ income: number; expense: number }> => {
  const result = await query<{ type: string; total: string }>(
    `SELECT 
       CASE 
         WHEN c.parent_id = 1 OR EXISTS (
           SELECT 1 FROM categories c2 
           WHERE c2.id = c.parent_id AND c2.parent_id = 1
         ) THEN 'income'
         ELSE 'expense'
       END as type,
       SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3
     GROUP BY type`,
    [userId, from, to]
  );
  
  let income = 0;
  let expense = 0;
  
  for (const row of result) {
    if (row.type === 'income') {
      income = parseFloat(row.total || '0');
    } else {
      expense = parseFloat(row.total || '0');
    }
  }
  
  return { income, expense };
};
