-- Migration: Add Mid-Semester Results Release Feature
-- Run this in Supabase SQL Editor
-- 
-- This adds support for:
-- 1. Separate mid-semester results release (standalone, contributes 15% to final)
-- 2. Track which exams are part of mid-semester results

-- 1. Add mid_semester_released flag to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS mid_semester_released BOOLEAN DEFAULT false;

-- 2. Add index for mid_semester_released for faster queries
CREATE INDEX IF NOT EXISTS idx_exams_mid_semester_released 
ON exams(mid_semester_released);

-- 3. Add exam_type column if it doesn't exist (for filtering mid-semester exams)
-- Note: This assumes exam_type already exists from other migrations
-- If not, you'll need to run the exam_type migration first

-- 4. Add comment for documentation
COMMENT ON COLUMN exams.mid_semester_released IS 
'Set to true by admin when mid-semester results are released. Mid-semester is standalone but contributes 15% to final grade. Includes: bft_1, mid_cs_exam, mid_course_exercise, quiz, quiz_manual';

-- 5. Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'exams' 
AND column_name = 'mid_semester_released';

-- Note: 
-- - mid_semester_released controls when students can see mid-semester results
-- - Mid-semester includes: BFT 1, Mid CS Exams, Mid Course Exercise, quizzes
-- - Mid-semester is standalone but contributes 15% to final grade calculation
-- - Formula: Final Grade = (Mid-semester average % × 15%) + Final semester components
