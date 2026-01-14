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
-- SHA256 Hash: 3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121
INSERT INTO users (username, name, email, password, role, created_at)
VALUES (
    'admin',
    'System Administrator',
    'admin@signalschool.mil.gh',
    '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121',
    'admin',
    NOW()
)
ON CONFLICT (username) DO UPDATE
SET 
    role = 'admin',
    password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121',
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
