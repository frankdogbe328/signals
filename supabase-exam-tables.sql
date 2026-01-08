-- Exam Portal Database Tables
-- Run this in Supabase SQL Editor

-- 1. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    class_id TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_score INTEGER,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    results_released BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    options JSONB, -- For multiple choice: ["option1", "option2", "option3", "option4"]
    correct_answer TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Student Exam Attempts Table
CREATE TABLE IF NOT EXISTS student_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_remaining_seconds INTEGER,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'time_expired', 'auto_submitted')),
    score INTEGER,
    total_marks INTEGER,
    percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, exam_id, status) -- One active attempt per student per exam
);

-- 4. Student Responses Table
CREATE TABLE IF NOT EXISTS student_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_answer TEXT NOT NULL,
    is_correct BOOLEAN,
    marks_awarded INTEGER DEFAULT 0,
    sequence_order INTEGER NOT NULL, -- Order student saw this question
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attempt_id, question_id) -- One answer per question per attempt
);

-- 5. Exam Grades Table (for gradebook)
CREATE TABLE IF NOT EXISTS exam_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade TEXT, -- 'A', 'B', 'C', 'D', 'F'
    scaling_percentage DECIMAL(5,2) DEFAULT 0, -- e.g., 5% for first quiz
    scaled_score DECIMAL(5,2) DEFAULT 0, -- Final scaled score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, exam_id) -- One grade per student per exam
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_lecturer ON exams(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_active ON exams(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON student_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON student_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON student_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON student_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON exam_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_exam ON exam_grades(exam_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attempts_updated_at BEFORE UPDATE ON student_exam_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Disabled for now (using custom auth)
-- ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_exam_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exam_grades ENABLE ROW LEVEL SECURITY;

