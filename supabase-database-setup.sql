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

-- 5. DISABLE Row Level Security (RLS) for custom authentication
-- Since we're using custom username/password auth (not Supabase Auth),
-- we'll disable RLS and handle security at the application level
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;

-- Note: RLS is disabled because we're using custom authentication.
-- Security is handled at the application level in JavaScript.
-- For production, consider implementing proper authentication or enabling Supabase Auth.

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

