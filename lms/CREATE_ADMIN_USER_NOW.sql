-- ============================================
-- CREATE ADMIN USER - RUN THIS NOW IN SUPABASE
-- ============================================
-- This script will create the admin user if it doesn't exist
-- Password: Admin123!
-- Username: cbt
-- Role: admin

-- Step 1: Make sure role constraint allows 'admin'
-- Drop any existing role constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1 CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_check_role CASCADE;

-- Add constraint that allows admin
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('lecturer', 'student', 'admin'));

-- Step 2: Delete any existing admin user (to start fresh)
DELETE FROM users WHERE username = 'cbt' AND role = 'admin';

-- Step 3: Create the admin user
-- Password: Admin123!
-- SHA256 Hash: 3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121
INSERT INTO users (
    username,
    password,
    role,
    name,
    email
) VALUES (
    'cbt',
    '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121',
    'admin',
    'System Administrator',
    'admin@signalschool.mil.gh'
);

-- Step 4: Verify the admin user was created
SELECT 
    id,
    username,
    name,
    role,
    email,
    LENGTH(password) as password_length,
    CASE 
        WHEN password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121' 
        THEN '✅ CORRECT'
        ELSE '❌ WRONG'
    END as password_status
FROM users
WHERE username = 'cbt' AND role = 'admin';

-- Expected Result:
-- You should see ONE row with:
-- username: cbt
-- role: admin
-- password_length: 64
-- password_status: ✅ CORRECT

-- If you see this result, the admin user is ready!
-- Go back to admin-login.html and login with:
-- Username: cbt
-- Password: Admin123!
