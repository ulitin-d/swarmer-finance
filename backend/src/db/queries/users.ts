import { query, queryOne, execute } from '../index';
import { User } from '../../types';

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
};

export const getUserById = async (id: number): Promise<User | null> => {
  return queryOne<User>('SELECT id, email, created_at FROM users WHERE id = $1', [id]);
};

export const createUser = async (email: string, passwordHash: string): Promise<User> => {
  const result = await query<User>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, passwordHash]
  );
  return result[0];
};
