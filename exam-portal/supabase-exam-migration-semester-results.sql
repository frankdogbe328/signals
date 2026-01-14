-- Migration: Add Final Semester Results Release Feature
-- Run this in Supabase SQL Editor
-- 
-- This adds support for:
-- 1. Separate final semester results release (admin-controlled)
-- 2. Written score input for final exams (40 objective + 60 written)
-- 3. Score breakdown tracking (objective vs written)

-- 1. Add semester_results_released flag to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS semester_results_released BOOLEAN DEFAULT false;

-- 2. Add score breakdown columns to exam_grades table
ALTER TABLE exam_grades
ADD COLUMN IF NOT EXISTS objective_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS written_score DECIMAL(5,2);

-- 3. Add index for semester_results_released for faster queries
CREATE INDEX IF NOT EXISTS idx_exams_semester_results_released 
ON exams(semester_results_released);

-- 4. Add comment for documentation
COMMENT ON COLUMN exams.semester_results_released IS 
'Set to true by admin when final semester results are ready to be released to students. Separate from results_released which is for individual exam results.';

COMMENT ON COLUMN exam_grades.objective_score IS 
'Score from objective questions (auto-graded). For final exams: typically 40 questions.';

COMMENT ON COLUMN exam_grades.written_score IS 
'Score from written questions (manually graded by lecturer). For final exams: typically 60 questions.';

-- 5. Update existing records (optional - sets default values)
UPDATE exam_grades 
SET objective_score = NULL, written_score = NULL 
WHERE objective_score IS NULL AND written_score IS NULL;

-- 6. Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'exams' 
AND column_name = 'semester_results_released';

SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'exam_grades' 
AND column_name IN ('objective_score', 'written_score');

-- Note: 
-- - objective_score + written_score should equal the total score
-- - For final exams: objective_score (max 40) + written_score (max 60) = 100 total
-- - percentage = ((objective_score + written_score) / total_marks) * 100
-- - semester_results_released controls when students can see final semester grades
