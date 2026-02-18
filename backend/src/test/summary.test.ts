import request from 'supertest';
import { createTestApp } from './testApp';
import { pool } from '../db';

const app = createTestApp();

describe('Summary API', () => {
  let token: string;
  let testUserId: number;
  let incomeCategoryId: number;
  let expenseCategoryId: number;

  beforeAll(async () => {
    const email = `summary${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });
    token = res.body.data.accessToken;
    
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    testUserId = userResult.rows[0].id;
    
    const catResult = await pool.query(`
      SELECT c.id FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      WHERE c.user_id = $1 AND p.id = 1 LIMIT 1
    `, [testUserId]);
    incomeCategoryId = catResult.rows[0]?.id;
    
    const expCatResult = await pool.query(`
      SELECT c.id FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      WHERE c.user_id = $1 AND p.id = 2 LIMIT 1
    `, [testUserId]);
    expenseCategoryId = expCatResult.rows[0]?.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM transactions WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM categories WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('GET /api/summary', () => {
    it('should return empty summary for new user', async () => {
      const res = await request(app)
        .get('/api/summary')
        .set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('income');
      expect(res.body.data).toHaveProperty('expense');
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data).toHaveProperty('period');
    });

    it('should calculate summary with transactions', async () => {
      await pool.query(
        `INSERT INTO transactions (user_id, category_id, amount, date)
         VALUES ($1, $2, 5000, '2026-02-15')`,
        [testUserId, incomeCategoryId]
      );
      await pool.query(
        `INSERT INTO transactions (user_id, category_id, amount, date)
         VALUES ($1, $2, 1500, '2026-02-16')`,
        [testUserId, expenseCategoryId]
      );

      const res = await request(app)
        .get('/api/summary')
        .set({ Authorization: `Bearer ${token}` });

      expect(res.status).toBe(200);
      expect(res.body.data.income).toBe(5000);
      expect(res.body.data.expense).toBe(1500);
      expect(res.body.data.balance).toBe(3500);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/summary');

      expect(res.status).toBe(401);
    });
  });
});
