-- ============================================
-- VERIFY ADMIN USER EXISTS - RUN THIS IN SUPABASE
-- ============================================
-- This script will help you verify if the admin user exists
-- and check if the password hash is correct

-- Step 1: Check if any admin users exist
SELECT 
    id,
    username,
    name,
    role,
    email,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_hash_preview
FROM users
WHERE role = 'admin';

-- Step 2: Check specifically for 'cbt' username
SELECT 
    id,
    username,
    name,
    role,
    email,
    LENGTH(password) as password_length,
    CASE 
        WHEN password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121' 
        THEN '✅ CORRECT HASH'
        ELSE '❌ WRONG HASH'
    END as password_status,
    password as password_hash
FROM users
WHERE username = 'cbt' AND role = 'admin';

-- Step 3: If user doesn't exist, this will show nothing
-- If user exists but hash is wrong, you'll see the wrong hash above

-- Expected Result:
-- You should see ONE row with:
-- username: cbt
-- role: admin
-- password_length: 64
-- password_status: ✅ CORRECT HASH
-- password_hash: 3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121

-- If you don't see any results, run: CREATE_ADMIN_USER_NOW.sql
-- If you see wrong hash, the password in database is incorrect
