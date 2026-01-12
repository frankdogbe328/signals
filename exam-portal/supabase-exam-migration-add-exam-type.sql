-- Migration: Add exam_type column to exams table
-- Run this in Supabase SQL Editor

-- Add exam_type column to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS exam_type TEXT CHECK (exam_type IN (
    'opening_exam',
    'quiz',
    'bft',
    'mid_course_exercise',
    'mid_cs_exam',
    'gen_assessment',
    'final_cse_exercise',
    'final_exam'
));

-- Add index for exam_type
CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON exams(exam_type);

-- Exam type percentage weights mapping:
-- opening_exam: 5%
-- quiz: 5%
-- bft: 5%
-- mid_course_exercise: 15%
-- mid_cs_exam: 20%
-- gen_assessment: 5%
-- final_cse_exercise: 20%
-- final_exam: 25%
