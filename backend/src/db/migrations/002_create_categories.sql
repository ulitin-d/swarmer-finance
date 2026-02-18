-- 002_create_categories.sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  color VARCHAR(7) DEFAULT '#000000',
  icon VARCHAR(50) DEFAULT 'folder',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_system_root CHECK (
    (user_id IS NULL AND parent_id IS NULL) OR 
    (user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Seed system root categories
INSERT INTO categories (id, user_id, name, parent_id) VALUES
  (1, NULL, 'Income', NULL),
  (2, NULL, 'Expenses', NULL)
ON CONFLICT (id) DO NOTHING;
