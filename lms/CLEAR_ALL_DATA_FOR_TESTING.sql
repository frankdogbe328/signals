-- ============================================
-- COMPLETE DATABASE CLEAR FOR TESTING
-- Run this in Supabase SQL Editor
-- WARNING: This will delete ALL data from the database!
-- ============================================

-- Step 1: Delete exam portal data (respecting foreign key constraints)
DELETE FROM student_responses;
DELETE FROM exam_grades;
DELETE FROM student_exam_attempts;
DELETE FROM questions;
DELETE FROM exams;

-- Step 2: Delete LMS portal data
DELETE FROM progress;
DELETE FROM materials;

-- Step 3: Delete all users (this will cascade to related data)
DELETE FROM users;

-- Step 4: Clear all files from Supabase Storage
DO $$
DECLARE
    file_record RECORD;
BEGIN
    -- Delete all files from the learning-materials bucket
    FOR file_record IN 
        SELECT name, bucket_id 
        FROM storage.objects 
        WHERE bucket_id = 'learning-materials'
    LOOP
        DELETE FROM storage.objects 
        WHERE bucket_id = 'learning-materials' 
        AND name = file_record.name;
    END LOOP;
END $$;

-- Step 5: Ensure role constraint allows 'admin' role
DO $$ 
BEGIN
    -- Drop existing role constraints
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1 CASCADE;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_check_role CASCADE;
    
    -- Add constraint that allows admin role
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('lecturer', 'student', 'admin'));
    
    RAISE NOTICE 'Role constraint updated to allow admin role';
END $$;

-- Step 6: Ensure required columns exist (phone_number, student_index)
-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_number TEXT;
        CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
        RAISE NOTICE 'Added phone_number column';
    END IF;
END $$;

-- Add student_index column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'student_index'
    ) THEN
        ALTER TABLE users ADD COLUMN student_index TEXT;
        CREATE INDEX IF NOT EXISTS idx_users_student_index ON users(student_index);
        RAISE NOTICE 'Added student_index column';
    END IF;
END $$;

-- Step 7: Verification queries (run these to verify)
SELECT 'Users remaining:' as info, COUNT(*) as count FROM users;
SELECT 'Exams remaining:' as info, COUNT(*) as count FROM exams;
SELECT 'Questions remaining:' as info, COUNT(*) as count FROM questions;
SELECT 'Materials remaining:' as info, COUNT(*) as count FROM materials;
SELECT 'Progress remaining:' as info, COUNT(*) as count FROM progress;

-- Expected result: All counts should be 0 after successful deletion
-- ============================================
-- Database cleared and columns verified! Ready for testing.
-- ============================================
