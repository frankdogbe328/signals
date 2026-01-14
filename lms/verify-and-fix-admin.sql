-- Comprehensive Admin User Verification and Fix Script
-- This script will:
-- 1. Check if admin user exists
-- 2. Show current password hash
-- 3. Update password hash if needed
-- 4. Verify role constraint allows 'admin'

-- Step 1: Check current admin user status
SELECT 
    id,
    username,
    name,
    role,
    email,
    CASE 
        WHEN LENGTH(password) = 64 AND password ~ '^[a-f0-9]{64}$' THEN 'SHA256 Hash (64 chars)'
        ELSE 'Other format'
    END as password_format,
    LEFT(password, 20) || '...' as password_preview
FROM users
WHERE username = 'admin' AND role = 'admin';

-- Step 2: Check role constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname LIKE '%role%';

-- Step 3: Drop existing role constraint if it doesn't allow 'admin'
DO $$
BEGIN
    -- Drop all role check constraints
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check2;
    
    -- Add new constraint that allows 'admin'
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('lecturer', 'student', 'admin'));
    
    RAISE NOTICE 'Role constraint updated to allow admin';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;

-- Step 4: Delete existing admin user if exists (to recreate fresh)
DELETE FROM users WHERE username = 'admin' AND role = 'admin';

-- Step 5: Create admin user with correct password hash
-- Password: Admin123!
-- SHA256 Hash: 3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121
INSERT INTO users (
    username,
    password,
    role,
    name,
    email
) VALUES (
    'admin',
    '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121',
    'admin',
    'System Administrator',
    'admin@signalschool.mil.gh'
)
ON CONFLICT (username, role) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- Step 6: Verify admin user was created/updated
SELECT 
    id,
    username,
    name,
    role,
    email,
    CASE 
        WHEN password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121' THEN '✅ Correct hash'
        ELSE '❌ Wrong hash'
    END as password_status,
    LENGTH(password) as password_length
FROM users
WHERE username = 'admin' AND role = 'admin';

-- Step 7: Test query (simulate what the app does)
SELECT 
    id,
    username,
    name,
    role,
    email
FROM users
WHERE (username = 'admin' OR name = 'admin')
AND role = 'admin'
LIMIT 1;
