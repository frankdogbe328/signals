-- Add student_index column to users table
-- This column stores unique student indices per class (e.g., SB-001, SB-002 for SIGNALS BASIC)

-- Add the column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS student_index TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_student_index ON users(student_index);

-- Create unique constraint on student_index (each index must be unique)
-- Note: This will fail if there are duplicate indices, so handle existing data first
-- ALTER TABLE users ADD CONSTRAINT unique_student_index UNIQUE (student_index);
