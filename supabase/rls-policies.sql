-- Supabase Row Level Security (RLS) Policies
-- IMPORTANT: These policies work with custom authentication
-- You'll need to create a helper function to get the current user ID

-- ============================================
-- HELPER FUNCTION: Get Current User ID
-- ============================================
-- This function extracts the user ID from the request headers
-- You'll need to pass user_id in the Authorization header or as a JWT claim
-- For custom auth, we'll use a session-based approach

-- Create a function to get current user from session
-- This requires storing session tokens in a sessions table
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
    session_token TEXT;
    user_uuid UUID;
BEGIN
    -- Get token from request headers (if using Supabase Edge Functions)
    -- For direct client access, we'll use a different approach
    -- This is a placeholder - you'll need to adapt based on your auth method
    
    -- Option 1: If using service role with user context
    -- session_token := current_setting('request.headers', true)::json->>'authorization';
    
    -- Option 2: For now, return NULL and use service role bypass
    -- In production, implement proper session validation
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_grades ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text OR id = get_current_user_id());

-- Users can update their own profile (except role and password changes require admin)
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text OR id = get_current_user_id())
    WITH CHECK (auth.uid()::text = id::text OR id = get_current_user_id());

-- Public registration (anyone can insert, but with validation)
CREATE POLICY "Anyone can register"
    ON users FOR INSERT
    WITH CHECK (true); -- Additional validation handled in application code

-- ============================================
-- MATERIALS TABLE POLICIES
-- ============================================

-- Lecturers can view materials they uploaded
CREATE POLICY "Lecturers can view own materials"
    ON materials FOR SELECT
    USING (
        uploaded_by = (SELECT id::text FROM users WHERE id = get_current_user_id())
        OR
        -- Students can view materials for their class and registered courses
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'student'
        AND class = (SELECT class FROM users WHERE id = get_current_user_id())
        AND course = ANY(SELECT jsonb_array_elements_text(courses) FROM users WHERE id = get_current_user_id())
    );

-- Only lecturers can insert materials
CREATE POLICY "Lecturers can create materials"
    ON materials FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'lecturer'
        AND uploaded_by = (SELECT id::text FROM users WHERE id = get_current_user_id())
        AND course = ANY(SELECT jsonb_array_elements_text(courses) FROM users WHERE id = get_current_user_id())
    );

-- Lecturers can update their own materials
CREATE POLICY "Lecturers can update own materials"
    ON materials FOR UPDATE
    USING (uploaded_by = (SELECT id::text FROM users WHERE id = get_current_user_id()))
    WITH CHECK (uploaded_by = (SELECT id::text FROM users WHERE id = get_current_user_id()));

-- Lecturers can delete their own materials
CREATE POLICY "Lecturers can delete own materials"
    ON materials FOR DELETE
    USING (uploaded_by = (SELECT id::text FROM users WHERE id = get_current_user_id()));

-- ============================================
-- EXAMS TABLE POLICIES
-- ============================================

-- Lecturers can view their own exams
CREATE POLICY "Lecturers can view own exams"
    ON exams FOR SELECT
    USING (
        lecturer_id = get_current_user_id()
        OR
        -- Students can view active exams for their class and registered subjects
        (
            (SELECT role FROM users WHERE id = get_current_user_id()) = 'student'
            AND is_active = true
            AND class_id = (SELECT class FROM users WHERE id = get_current_user_id())
            AND subject = ANY(SELECT jsonb_array_elements_text(courses) FROM users WHERE id = get_current_user_id())
        )
    );

-- Only lecturers can create exams
CREATE POLICY "Lecturers can create exams"
    ON exams FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'lecturer'
        AND lecturer_id = get_current_user_id()
        AND subject = ANY(SELECT jsonb_array_elements_text(courses) FROM users WHERE id = get_current_user_id())
    );

-- Lecturers can update their own exams
CREATE POLICY "Lecturers can update own exams"
    ON exams FOR UPDATE
    USING (lecturer_id = get_current_user_id())
    WITH CHECK (lecturer_id = get_current_user_id());

-- Lecturers can delete their own exams
CREATE POLICY "Lecturers can delete own exams"
    ON exams FOR DELETE
    USING (lecturer_id = get_current_user_id());

-- ============================================
-- QUESTIONS TABLE POLICIES
-- ============================================

-- Users can view questions for exams they have access to
CREATE POLICY "Users can view accessible questions"
    ON questions FOR SELECT
    USING (
        exam_id IN (
            SELECT id FROM exams
            WHERE lecturer_id = get_current_user_id()
            OR (
                is_active = true
                AND class_id = (SELECT class FROM users WHERE id = get_current_user_id())
                AND subject = ANY(SELECT jsonb_array_elements_text(courses) FROM users WHERE id = get_current_user_id())
            )
        )
    );

-- Only lecturers can create questions for their exams
CREATE POLICY "Lecturers can create questions for own exams"
    ON questions FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'lecturer'
        AND exam_id IN (
            SELECT id FROM exams WHERE lecturer_id = get_current_user_id()
        )
    );

-- Lecturers can update questions for their exams
CREATE POLICY "Lecturers can update questions for own exams"
    ON questions FOR UPDATE
    USING (
        exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
    )
    WITH CHECK (
        exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
    );

-- Lecturers can delete questions for their exams
CREATE POLICY "Lecturers can delete questions for own exams"
    ON questions FOR DELETE
    USING (
        exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
    );

-- ============================================
-- STUDENT_EXAM_ATTEMPTS TABLE POLICIES
-- ============================================

-- Students can view their own attempts
-- Lecturers can view attempts for their exams
CREATE POLICY "Users can view accessible attempts"
    ON student_exam_attempts FOR SELECT
    USING (
        student_id = get_current_user_id()
        OR
        exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
    );

-- Students can create their own attempts
CREATE POLICY "Students can create own attempts"
    ON student_exam_attempts FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'student'
        AND student_id = get_current_user_id()
        AND exam_id IN (
            SELECT id FROM exams
            WHERE is_active = true
            AND class_id = (SELECT class FROM users WHERE id = get_current_user_id())
            AND subject = ANY(SELECT jsonb_array_elements_text(courses) FROM users WHERE id = get_current_user_id())
        )
    );

-- Students can update their own in-progress attempts
CREATE POLICY "Students can update own attempts"
    ON student_exam_attempts FOR UPDATE
    USING (student_id = get_current_user_id())
    WITH CHECK (student_id = get_current_user_id());

-- ============================================
-- STUDENT_RESPONSES TABLE POLICIES
-- ============================================

-- Students can view their own responses
-- Lecturers can view responses for their exam attempts
CREATE POLICY "Users can view accessible responses"
    ON student_responses FOR SELECT
    USING (
        attempt_id IN (
            SELECT id FROM student_exam_attempts
            WHERE student_id = get_current_user_id()
            OR exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
        )
    );

-- Students can create responses for their own attempts
CREATE POLICY "Students can create own responses"
    ON student_responses FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'student'
        AND attempt_id IN (
            SELECT id FROM student_exam_attempts
            WHERE student_id = get_current_user_id()
            AND status = 'in_progress'
        )
    );

-- Students can update responses for their own in-progress attempts
CREATE POLICY "Students can update own responses"
    ON student_responses FOR UPDATE
    USING (
        attempt_id IN (
            SELECT id FROM student_exam_attempts
            WHERE student_id = get_current_user_id()
            AND status = 'in_progress'
        )
    );

-- ============================================
-- EXAM_GRADES TABLE POLICIES
-- ============================================

-- Students can view their own grades
-- Lecturers can view grades for their exams
CREATE POLICY "Users can view accessible grades"
    ON exam_grades FOR SELECT
    USING (
        student_id = get_current_user_id()
        OR
        exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
    );

-- System can create grades (via triggers or application)
-- Lecturers can insert grades for their exams
CREATE POLICY "Lecturers can create grades for own exams"
    ON exam_grades FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE id = get_current_user_id()) = 'lecturer'
        AND exam_id IN (SELECT id FROM exams WHERE lecturer_id = get_current_user_id())
    );

-- ============================================
-- PROGRESS TABLE POLICIES
-- ============================================

-- Students can view their own progress
-- Lecturers can view progress for materials they uploaded
CREATE POLICY "Users can view accessible progress"
    ON progress FOR SELECT
    USING (
        user_id = get_current_user_id()
        OR
        material_id IN (
            SELECT id FROM materials
            WHERE uploaded_by = (SELECT id::text FROM users WHERE id = get_current_user_id())
        )
    );

-- Students can create/update their own progress
CREATE POLICY "Students can manage own progress"
    ON progress FOR ALL
    USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- ============================================
-- NOTES FOR IMPLEMENTATION
-- ============================================

-- IMPORTANT: The get_current_user_id() function needs to be implemented
-- based on your authentication method. Options:

-- Option 1: Use Supabase Auth (recommended for production)
-- Replace get_current_user_id() with auth.uid() throughout

-- Option 2: Use session tokens stored in a sessions table
-- CREATE TABLE sessions (
--     token TEXT PRIMARY KEY,
--     user_id UUID REFERENCES users(id),
--     expires_at TIMESTAMP WITH TIME ZONE
-- );
-- Then modify get_current_user_id() to lookup from sessions table

-- Option 3: Use service role key bypass (NOT RECOMMENDED)
-- Disable RLS or use service role key for all operations
-- This defeats the purpose of RLS but works with custom auth

-- Option 4: Use Supabase Edge Functions
-- Validate session in Edge Function and use service role with user context
-- This is the recommended approach for custom auth with RLS

-- For now, these policies serve as a template. You'll need to:
-- 1. Implement proper session management in a sessions table
-- 2. Update get_current_user_id() to validate sessions
-- 3. Pass session token in request headers from client
-- 4. Or migrate to Supabase Auth for better RLS support
