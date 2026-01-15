-- Performance Optimization Indexes for LMS System
-- Run these in Supabase SQL Editor to improve query performance

-- Exam Grades Indexes (Critical for results queries)
CREATE INDEX IF NOT EXISTS idx_exam_grades_student_id ON exam_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_grades_exam_id ON exam_grades(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_grades_created_at ON exam_grades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_grades_student_exam ON exam_grades(student_id, exam_id);

-- Exams Indexes (Critical for filtering)
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject);
CREATE INDEX IF NOT EXISTS idx_exams_is_active ON exams(is_active);
CREATE INDEX IF NOT EXISTS idx_exams_results_released ON exams(results_released);
CREATE INDEX IF NOT EXISTS idx_exams_class_subject ON exams(class_id, subject);
CREATE INDEX IF NOT EXISTS idx_exams_lecturer_id ON exams(lecturer_id);

-- Users Indexes (Critical for user lookups)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class ON users(class);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_class ON users(role, class);

-- Student Exam Attempts Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON student_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id ON student_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON student_exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_student_exam ON student_exam_attempts(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at ON student_exam_attempts(submitted_at DESC);

-- Student Responses Indexes
CREATE INDEX IF NOT EXISTS idx_responses_attempt_id ON student_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON student_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt_question ON student_responses(attempt_id, question_id);

-- Questions Indexes
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_sequence ON questions(exam_id, sequence_order);

-- Materials Indexes
CREATE INDEX IF NOT EXISTS idx_materials_lecturer_id ON learning_materials(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_materials_class_id ON learning_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON learning_materials(subject);
CREATE INDEX IF NOT EXISTS idx_materials_class_subject ON learning_materials(class_id, subject);

-- Analyze tables to update statistics (helps query planner)
ANALYZE exam_grades;
ANALYZE exams;
ANALYZE users;
ANALYZE student_exam_attempts;
ANALYZE student_responses;
ANALYZE questions;
ANALYZE learning_materials;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('exam_grades', 'exams', 'users', 'student_exam_attempts', 'student_responses', 'questions', 'learning_materials')
ORDER BY tablename, indexname;
