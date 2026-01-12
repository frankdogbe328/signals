-- ⚠️ WARNING: This script will DELETE ALL USERS and ALL RELATED DATA
-- This includes:
-- - All users (students and lecturers)
-- - All exam data (exams, questions, attempts, responses, grades)
-- 
-- USE WITH EXTREME CAUTION! This action cannot be undone.
-- Make sure you have a backup if you need to recover any data.

-- Delete in order (respecting foreign key constraints)

-- Step 1: Delete all exam-related data first

-- Delete student responses (depends on attempts)
DELETE FROM student_responses;

-- Delete exam grades (depends on attempts and exams)
DELETE FROM exam_grades;

-- Delete student exam attempts (depends on exams and users)
DELETE FROM student_exam_attempts;

-- Delete questions (depends on exams)
DELETE FROM questions;

-- Delete exams (depends on users/lecturers)
DELETE FROM exams;

-- Step 2: Delete learning materials (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
        EXECUTE 'DELETE FROM materials';
        RAISE NOTICE 'Deleted from materials table';
    ELSE
        RAISE NOTICE 'materials table does not exist, skipping';
    END IF;
END $$;

-- Step 3: Finally, delete all users
-- This will delete both students and lecturers
DELETE FROM users;

-- Step 4: Verify deletion (check counts)
SELECT 'Users remaining:' as info, COUNT(*) as count FROM users;
SELECT 'Exams remaining:' as info, COUNT(*) as count FROM exams;
SELECT 'Questions remaining:' as info, COUNT(*) as count FROM questions;
SELECT 'Attempts remaining:' as info, COUNT(*) as count FROM student_exam_attempts;
SELECT 'Responses remaining:' as info, COUNT(*) as count FROM student_responses;
SELECT 'Grades remaining:' as info, COUNT(*) as count FROM exam_grades;

-- If you see any counts > 0, there might be data that couldn't be deleted
-- due to foreign key constraints. Check the error messages above.
