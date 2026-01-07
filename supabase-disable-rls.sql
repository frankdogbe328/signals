-- Disable RLS temporarily for custom authentication
-- Run this AFTER the main setup SQL if you get permission errors

-- Disable RLS (we'll use application-level security for now)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can register" ON users;
DROP POLICY IF EXISTS "Authenticated users can read materials" ON materials;
DROP POLICY IF EXISTS "Lecturers can manage materials" ON materials;
DROP POLICY IF EXISTS "Users can manage own progress" ON progress;

