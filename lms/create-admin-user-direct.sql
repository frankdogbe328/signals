-- Direct Admin User Creation (Alternative Method)
-- Use this if the DO block method doesn't work
-- Run this in Supabase SQL Editor

-- First, ensure the role constraint allows 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1 CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_check_role CASCADE;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('lecturer', 'student', 'admin'));

-- Delete existing admin user if you want to recreate
-- DELETE FROM users WHERE username = 'admin' AND role = 'admin';

-- Create admin user directly
-- Password: Admin123!
-- SHA256 Hash: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
INSERT INTO users (username, name, email, password, role, created_at)
VALUES (
    'admin',
    'System Administrator',
    'admin@signalschool.mil.gh',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    'admin',
    NOW()
)
ON CONFLICT (username) DO UPDATE
SET 
    role = 'admin',
    password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    name = 'System Administrator',
    email = 'admin@signalschool.mil.gh';

-- Verify admin user was created
SELECT 
    id,
    username,
    name,
    email,
    role,
    LENGTH(password) as password_length,
    created_at
FROM users 
WHERE username = 'admin' AND role = 'admin';

-- Expected result: Should show one row with:
-- username: admin
-- role: admin
-- password_length: 64
