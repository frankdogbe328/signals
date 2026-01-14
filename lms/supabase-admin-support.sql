-- Admin Role Support for LMS
-- Run this in Supabase SQL Editor to add admin role support

-- Add admin role to users table if it doesn't exist
-- Note: This assumes your users table already has a 'role' column
-- If not, you'll need to add it first

-- Update existing users to ensure role is set (optional - only if needed)
-- UPDATE users SET role = 'student' WHERE role IS NULL;

-- Create an admin user (change the credentials!)
-- Password: Admin123! (change this!)
-- Username: admin
-- Email: admin@signalschool.mil.gh (change this!)

-- First, check if admin user exists
DO $$
DECLARE
    admin_exists BOOLEAN;
    admin_password_hash TEXT;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin' AND role = 'admin') INTO admin_exists;
    
    -- Hash password: Admin123! (SHA256)
    -- In production, use proper password hashing
    admin_password_hash := 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; -- This is SHA256 of 'Admin123!'
    
    -- Create admin user if it doesn't exist
    IF NOT admin_exists THEN
        INSERT INTO users (username, name, email, password, role, created_at)
        VALUES (
            'admin',
            'System Administrator',
            'admin@signalschool.mil.gh', -- CHANGE THIS EMAIL
            admin_password_hash, -- CHANGE THIS PASSWORD HASH
            'admin',
            NOW()
        );
        
        RAISE NOTICE 'Admin user created successfully!';
        RAISE NOTICE 'Username: admin';
        RAISE NOTICE 'Default Password: Admin123!';
        RAISE NOTICE '⚠️ IMPORTANT: Change the password immediately after first login!';
    ELSE
        RAISE NOTICE 'Admin user already exists.';
    END IF;
END $$;

-- Verify admin user was created
SELECT id, username, name, email, role, created_at 
FROM users 
WHERE role = 'admin';

-- Add index for admin queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Note: After running this script:
-- 1. Login with username: admin, password: Admin123!
-- 2. Change the password immediately
-- 3. Update the email address to your admin email
-- 4. The admin portal will be accessible at admin-portal.html
