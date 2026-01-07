-- Supabase Database Setup SQL
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('lecturer', 'officer')),
    name TEXT NOT NULL,
    class TEXT,
    courses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create materials table
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

-- 3. Create progress table
CREATE TABLE IF NOT EXISTS progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, material_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_class ON materials(class);
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for users table
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Anyone can insert (for registration)
CREATE POLICY "Anyone can register" ON users
    FOR INSERT WITH CHECK (true);

-- 7. Create RLS Policies for materials table
-- Authenticated users can read materials
CREATE POLICY "Authenticated users can read materials" ON materials
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only lecturers can insert/update/delete materials
CREATE POLICY "Lecturers can manage materials" ON materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'lecturer'
        )
    );

-- 8. Create RLS Policies for progress table
-- Users can read/write their own progress
CREATE POLICY "Users can manage own progress" ON progress
    FOR ALL USING (auth.uid()::text = user_id::text);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

