-- ⚠️ WARNING: This script will DELETE ALL USERS and ALL RELATED DATA
-- This includes:
-- - All users (students and lecturers)
-- - All exam data (exams, questions, attempts, responses, grades)
-- - All learning materials
-- - All progress records
-- 
-- USE WITH EXTREME CAUTION! This action cannot be undone.
-- Make sure you have a backup if you need to recover any data.

-- Step 1: Delete all exam-related data first (due to foreign key constraints)

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

-- Step 2: Delete learning management system data

-- Delete student progress records (if exists, depends on materials and users)
-- DELETE FROM student_progress; -- Uncomment if this table exists

-- Delete learning materials (depends on users/lecturers)
DELETE FROM materials; -- Uncomment if this table exists

-- Delete any other user-related data
-- Add more DELETE statements here for any other tables that reference users

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
