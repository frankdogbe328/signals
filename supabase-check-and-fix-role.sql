-- Check and Fix Role Constraint Issues
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraint
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%';

-- Step 2: Check if any users have invalid roles
SELECT id, username, role, email 
FROM users 
WHERE role NOT IN ('lecturer', 'student');

-- Step 3: If you see 'officer' roles, update them to 'student'
-- UPDATE users SET role = 'student' WHERE role = 'officer';

-- Step 4: Drop old constraint(s)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_check_role;

-- Step 5: Add correct constraint (role must be 'lecturer' or 'student')
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('lecturer', 'student'));

-- Step 6: Verify constraint was added
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_role_check';

-- Step 7: Test the constraint (should return empty if all valid)
SELECT id, username, role 
FROM users 
WHERE role NOT IN ('lecturer', 'student');

