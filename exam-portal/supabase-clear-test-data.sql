-- Clear Test Data Script
-- ⚠️ WARNING: This will delete ALL data from exam-related tables
-- Use with caution! Make sure you want to delete all test data before running.

-- Option 1: Delete all exam-related data (recommended for clearing test data)
DELETE FROM student_responses;
DELETE FROM exam_grades;
DELETE FROM student_exam_attempts;
DELETE FROM questions;
DELETE FROM exams;

-- Option 2: Delete only attempts and responses (keeps exam structure)
-- Uncomment if you want to keep exams and questions but clear student attempts:
-- DELETE FROM student_responses;
-- DELETE FROM exam_grades;
-- DELETE FROM student_exam_attempts;

-- Option 3: Delete specific test exams by title pattern
-- Uncomment and modify if you want to delete only specific test exams:
-- DELETE FROM student_responses 
-- WHERE attempt_id IN (
--     SELECT id FROM student_exam_attempts 
--     WHERE exam_id IN (
--         SELECT id FROM exams WHERE title LIKE '%Test%' OR title LIKE '%test%'
--     )
-- );
-- DELETE FROM exam_grades WHERE exam_id IN (SELECT id FROM exams WHERE title LIKE '%Test%' OR title LIKE '%test%');
-- DELETE FROM student_exam_attempts WHERE exam_id IN (SELECT id FROM exams WHERE title LIKE '%Test%' OR title LIKE '%test%');
-- DELETE FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE title LIKE '%Test%' OR title LIKE '%test%');
-- DELETE FROM exams WHERE title LIKE '%Test%' OR title LIKE '%test%';

-- Verify deletion (check counts)
SELECT 'Exams remaining:' as info, COUNT(*) as count FROM exams;
SELECT 'Questions remaining:' as info, COUNT(*) as count FROM questions;
SELECT 'Attempts remaining:' as info, COUNT(*) as count FROM student_exam_attempts;
SELECT 'Responses remaining:' as info, COUNT(*) as count FROM student_responses;
SELECT 'Grades remaining:' as info, COUNT(*) as count FROM exam_grades;
