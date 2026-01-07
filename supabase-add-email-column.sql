-- Add email column to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Make email unique (optional - uncomment if you want unique emails)
-- ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

