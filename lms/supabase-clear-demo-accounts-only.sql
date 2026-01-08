-- ============================================
-- CLEAR DEMO ACCOUNTS ONLY
-- Run this if you only want to remove demo accounts
-- Keeps any real accounts that have been created
-- ============================================

-- Step 1: Delete demo accounts and their associated data
-- Delete progress for demo accounts first
DELETE FROM progress 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE username IN ('lecturer1', 'student1', 'lecturer', 'student', 'demo_lecturer', 'demo_student')
);

-- Step 2: Delete demo users
DELETE FROM users 
WHERE username IN ('lecturer1', 'student1', 'lecturer', 'student', 'demo_lecturer', 'demo_student');

-- Step 3: Delete any materials uploaded by demo accounts
DELETE FROM materials 
WHERE uploaded_by IN ('lecturer1', 'lecturer', 'demo_lecturer');

-- Step 4: Verify demo accounts are removed
-- SELECT * FROM users WHERE username IN ('lecturer1', 'student1', 'lecturer', 'student', 'demo_lecturer', 'demo_student');

-- ============================================
-- Demo accounts cleared!
-- ============================================

