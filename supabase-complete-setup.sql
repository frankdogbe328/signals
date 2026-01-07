-- ============================================
-- COMPLETE SUPABASE SETUP FOR LMS
-- Paste this entire file into Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('lecturer', 'student')),
    name TEXT NOT NULL,
    email TEXT,
    class TEXT,
    courses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials Table
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course TEXT NOT NULL,
    class TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    description TEXT,
    category TEXT,
    sequence INTEGER DEFAULT 999,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_file BOOLEAN DEFAULT FALSE,
    file_name TEXT,
    file_type TEXT,
    file_url TEXT
);

-- Progress Table
CREATE TABLE IF NOT EXISTS progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, material_id)
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Materials table indexes
CREATE INDEX IF NOT EXISTS idx_materials_class ON materials(class);
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course);

-- Progress table indexes
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_material ON progress(material_id);

-- ============================================
-- 3. DISABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- Since we're using custom authentication (not Supabase Auth),
-- we disable RLS and handle security at the application level

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE FUNCTION FOR AUTO-UPDATE TIMESTAMP
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. STORAGE POLICIES (for file uploads)
-- ============================================
-- Note: You must create the storage bucket manually first:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create Bucket"
-- 3. Name: learning-materials
-- 4. Public: Yes (checked)
-- 5. File size limit: 50MB
-- 6. Click "Create Bucket"

-- Policy for public file downloads (students can access)
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Public Access for Learning Materials" ON storage.objects;
CREATE POLICY "Public Access for Learning Materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'learning-materials');

-- Policy for file uploads (lecturers can upload)
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Allow Uploads to Learning Materials" ON storage.objects;
CREATE POLICY "Allow Uploads to Learning Materials"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'learning-materials');

-- Policy for file deletions (lecturers can delete)
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Allow Deletes from Learning Materials" ON storage.objects;
CREATE POLICY "Allow Deletes from Learning Materials"
ON storage.objects
FOR DELETE
USING (bucket_id = 'learning-materials');

-- ============================================
-- 6. HELPER VIEWS (Optional - for easier viewing)
-- ============================================

-- View to organize users by role
CREATE OR REPLACE VIEW users_by_role AS
SELECT 
    id,
    username,
    name,
    email,
    role,
    class,
    courses,
    created_at,
    updated_at
FROM users
ORDER BY 
    CASE role 
        WHEN 'lecturer' THEN 1 
        WHEN 'student' THEN 2 
    END,
    name ASC;

-- View to display courses as readable text (instead of JSONB)
CREATE OR REPLACE VIEW users_with_readable_courses AS
SELECT 
    id,
    username,
    name,
    email,
    role,
    class,
    -- Convert JSONB array to comma-separated text
    CASE 
        WHEN courses IS NULL OR courses::text = '[]' THEN 'No courses registered'
        WHEN jsonb_array_length(courses) = 0 THEN 'No courses registered'
        ELSE array_to_string(
            ARRAY(
                SELECT jsonb_array_elements_text(courses)
            ),
            ', '
        )
    END as readable_courses,
    courses as courses_jsonb, -- Keep original JSONB for reference
    created_at,
    updated_at
FROM users
ORDER BY role, name;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- After running this SQL:
-- 1. Create storage bucket manually (see step 5 above)
-- 2. Test the helper functions in your JavaScript code
-- 3. Verify tables exist in Supabase Dashboard → Table Editor

-- ============================================
-- USEFUL QUERIES TO VERIFY SETUP
-- ============================================

-- View all users
-- SELECT * FROM users;

-- View all materials
-- SELECT * FROM materials;

-- View all progress
-- SELECT * FROM progress;

-- View users by role
-- SELECT * FROM users_by_role;

-- View users with readable courses
-- SELECT * FROM users_with_readable_courses;

-- Count users by role
-- SELECT role, COUNT(*) as total FROM users GROUP BY role;

-- View students grouped by class
-- SELECT class, COUNT(*) as total_students FROM users WHERE role = 'student' GROUP BY class;

