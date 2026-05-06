-- Add email column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
