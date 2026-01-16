-- ============================================
-- ENSURE REQUIRED COLUMNS EXIST
-- Run this after clearing the database to ensure all required columns exist
-- ============================================

-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_number TEXT;
        CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
        COMMENT ON COLUMN users.phone_number IS 'Phone number for students (Ghana format: +233XXXXXXXXX)';
        RAISE NOTICE 'Added phone_number column';
    ELSE
        RAISE NOTICE 'phone_number column already exists';
    END IF;
END $$;

-- Add student_index column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'student_index'
    ) THEN
        ALTER TABLE users ADD COLUMN student_index TEXT;
        CREATE INDEX IF NOT EXISTS idx_users_student_index ON users(student_index);
        COMMENT ON COLUMN users.student_index IS 'Unique student index per class (e.g., SB-001, SB-002)';
        RAISE NOTICE 'Added student_index column';
    ELSE
        RAISE NOTICE 'student_index column already exists';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('phone_number', 'student_index')
ORDER BY column_name;

-- ============================================
-- Columns verified/added successfully!
-- ============================================
