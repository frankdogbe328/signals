-- Migration: Fix exams_exam_type_check constraint with ALL exam types
-- Run this in Supabase SQL Editor
-- 
-- This ensures ALL exam types used in the system are allowed in the constraint
-- Run this if you're getting constraint violation errors

-- First, drop the existing constraint
ALTER TABLE exams 
DROP CONSTRAINT IF EXISTS exams_exam_type_check;

-- Recreate the constraint with ALL exam types included
ALTER TABLE exams 
ADD CONSTRAINT exams_exam_type_check CHECK (exam_type IN (
    'opening_exam',        -- Opening Exam (5%)
    'quiz',                -- Automated Quiz (5%)
    'quiz_manual',         -- Manual Quiz Entry (5% - adds to automated)
    'bft',                 -- Legacy BFT (5% - backward compatibility)
    'bft_1',               -- BFT 1 (2.5%)
    'bft_2',               -- BFT 2 (2.5%)
    'mid_course_exercise', -- Mid Course Exercise (15%)
    'mid_cs_exam',         -- Mid CS Exam (20%)
    'gen_assessment',      -- General Assessment (5%)
    'final_cse_exercise',  -- Final CSE Exercise (20%)
    'final_exam'           -- Final Exam (25%)
));

-- Verify the constraint was created correctly
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'exams_exam_type_check';

-- Expected result: You should see the constraint with all 11 exam types listed above
-- If you see this, the migration was successful!
