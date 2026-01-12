-- ⚠️ COMPLETE DATA CLEARANCE SCRIPT ⚠️
-- This script will DELETE EVERYTHING from the database
-- USE WITH EXTREME CAUTION! This action cannot be undone.
-- 
-- This deletes:
-- - All users (students and lecturers)
-- - All exams, questions, attempts, responses, grades
-- - All learning materials and progress
-- - Everything else in the database

-- ============================================
-- OPTION 1: Delete all data but keep table structure
-- ============================================

-- Delete in order (respecting foreign key constraints)

-- Exam Portal Data
DELETE FROM student_responses;
DELETE FROM exam_grades;
DELETE FROM student_exam_attempts;
DELETE FROM questions;
DELETE FROM exams;

-- LMS Portal Data (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
        EXECUTE 'DELETE FROM materials';
        RAISE NOTICE 'Deleted from materials table';
    ELSE
        RAISE NOTICE 'materials table does not exist, skipping';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_progress') THEN
        EXECUTE 'DELETE FROM student_progress';
        RAISE NOTICE 'Deleted from student_progress table';
    ELSE
        RAISE NOTICE 'student_progress table does not exist, skipping';
    END IF;
END $$;

-- Users (this will cascade to some related data if foreign keys are set up)
DELETE FROM users;

-- ============================================
-- OPTION 2: Delete specific user types only
-- ============================================
-- Uncomment to delete only students, or only lecturers:

-- Delete only students (and their data)
-- DELETE FROM student_responses WHERE attempt_id IN (
--     SELECT id FROM student_exam_attempts WHERE student_id IN (
--         SELECT id FROM users WHERE role = 'student'
--     )
-- );
-- DELETE FROM exam_grades WHERE student_id IN (SELECT id FROM users WHERE role = 'student');
-- DELETE FROM student_exam_attempts WHERE student_id IN (SELECT id FROM users WHERE role = 'student');
-- DELETE FROM student_progress WHERE student_id IN (SELECT id FROM users WHERE role = 'student');
-- DELETE FROM users WHERE role = 'student';

-- Delete only lecturers (and their data)
-- DELETE FROM questions WHERE exam_id IN (
--     SELECT id FROM exams WHERE lecturer_id IN (
--         SELECT id FROM users WHERE role = 'lecturer'
--     )
-- );
-- DELETE FROM exams WHERE lecturer_id IN (SELECT id FROM users WHERE role = 'lecturer');
-- DELETE FROM materials WHERE lecturer_id IN (SELECT id FROM users WHERE role = 'lecturer');
-- DELETE FROM users WHERE role = 'lecturer';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after deletion to verify everything is cleared:

SELECT 'Users remaining:' as info, COUNT(*) as count FROM users;
SELECT 'Lecturers:' as info, COUNT(*) as count FROM users WHERE role = 'lecturer';
SELECT 'Students:' as info, COUNT(*) as count FROM users WHERE role = 'student';
SELECT 'Exams remaining:' as info, COUNT(*) as count FROM exams;
SELECT 'Questions remaining:' as info, COUNT(*) as count FROM questions;
SELECT 'Attempts remaining:' as info, COUNT(*) as count FROM student_exam_attempts;
SELECT 'Responses remaining:' as info, COUNT(*) as count FROM student_responses;
SELECT 'Grades remaining:' as info, COUNT(*) as count FROM exam_grades;
-- Check materials only if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'materials') THEN
        EXECUTE 'SELECT ''Materials remaining:'' as info, COUNT(*) as count FROM materials';
    END IF;
END $$;

-- Expected result: All counts should be 0 after successful deletion
