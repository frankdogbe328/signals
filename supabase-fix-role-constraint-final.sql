-- ============================================
-- FIX ROLE CONSTRAINT - Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check what constraint currently exists
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%';

-- Step 2: Check for any users with old 'officer' role
SELECT id, username, role, email 
FROM users 
WHERE role = 'officer' OR role = 'Officer' OR role = 'OFFICER';

-- Step 3: Update any 'officer' roles to 'student'
UPDATE users 
SET role = 'student' 
WHERE LOWER(TRIM(role)) = 'officer';

-- Step 4: Drop ALL existing role constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1 CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_check_role CASCADE;

-- Step 5: Verify constraints are dropped
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND constraint_type = 'CHECK'
AND constraint_name LIKE '%role%';

-- Step 6: Create the correct constraint (role must be 'lecturer' or 'student')
-- Using exact match for CHECK constraint (PostgreSQL CHECK doesn't support functions)
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('lecturer', 'student'));

-- Step 7: Verify the new constraint was created
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_role_check';

-- Step 8: Test - this should return empty (no invalid roles)
SELECT id, username, role 
FROM users 
WHERE LOWER(TRIM(role)) NOT IN ('lecturer', 'student');

-- ============================================
-- If Step 8 returns any rows, update them:
-- UPDATE users SET role = 'student' WHERE LOWER(TRIM(role)) = 'officer';
-- ============================================

