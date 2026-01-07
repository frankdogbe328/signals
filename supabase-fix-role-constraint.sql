-- Fix Role Constraint in Users Table
-- Run this in Supabase SQL Editor to fix the role constraint issue

-- First, check current constraint
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name LIKE '%role%';

-- Drop existing constraint if it exists (with different names)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1;

-- Add correct constraint: role must be 'lecturer' or 'student'
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('lecturer', 'student'));

-- Verify the constraint was added correctly
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'users_role_check';

-- Check if any existing rows violate the constraint
-- SELECT id, username, role FROM users WHERE role NOT IN ('lecturer', 'student');

