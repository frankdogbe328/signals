-- Migration: Update exam_type CHECK constraint to allow bft_1 and bft_2
-- Run this in Supabase SQL Editor
-- 
-- This allows BFT (Battle Fitness Test) to be stored as bft_1 and bft_2
-- Each BFT contributes 2.5% (2 BFTs = 5% total)

-- First, drop the existing constraint
ALTER TABLE exams 
DROP CONSTRAINT IF EXISTS exams_exam_type_check;

-- Recreate the constraint with bft_1 and bft_2 included
ALTER TABLE exams 
ADD CONSTRAINT exams_exam_type_check CHECK (exam_type IN (
    'opening_exam',
    'quiz',
    'bft',           -- Legacy/backward compatibility
    'bft_1',         -- BFT 1 (2.5%)
    'bft_2',         -- BFT 2 (2.5%)
    'mid_course_exercise',
    'mid_cs_exam',
    'gen_assessment',
    'final_cse_exercise',
    'final_exam'
));

-- Verify the constraint was created
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'exams_exam_type_check';

-- Note: Exam type percentage weights:
-- opening_exam: 5%
-- quiz: 5%
-- bft: 5% (legacy)
-- bft_1: 2.5% (BFT 1)
-- bft_2: 2.5% (BFT 2)
-- mid_course_exercise: 15%
-- mid_cs_exam: 20%
-- gen_assessment: 5%
-- final_cse_exercise: 20%
-- final_exam: 25%
