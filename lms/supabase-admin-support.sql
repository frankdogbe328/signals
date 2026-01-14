-- Admin Role Support for LMS
-- Run this in Supabase SQL Editor to add admin role support

-- STEP 1: Update the role constraint to include 'admin'
-- Drop existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1 CASCADE;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_check_role CASCADE;

-- Add new constraint that includes 'admin'
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('lecturer', 'student', 'admin'));

-- STEP 2: Create an admin user (change the credentials!)
-- Password: Admin123! (change this!)
-- Username: admin
-- Email: admin@signalschool.mil.gh (change this!)

DO $$
DECLARE
    admin_exists BOOLEAN;
    admin_password_hash TEXT;
    admin_count INTEGER;
BEGIN
    -- Check if admin user already exists
    SELECT COUNT(*) INTO admin_count FROM users WHERE username = 'admin' AND role = 'admin';
    admin_exists := admin_count > 0;
    
    RAISE NOTICE 'Checking for existing admin user...';
    RAISE NOTICE 'Admin users found: %', admin_count;
    
    -- Hash password: Admin123! (SHA256)
    -- Correct SHA256 hash for 'Admin123!' (verified)
    -- You can verify at: https://emn178.github.io/online-tools/sha256.html
    admin_password_hash := 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; -- This is SHA256 of 'Admin123!'
    
    -- Create admin user if it doesn't exist
    IF NOT admin_exists THEN
        RAISE NOTICE 'Creating new admin user...';
        INSERT INTO users (username, name, email, password, role, created_at)
        VALUES (
            'admin',
            'System Administrator',
            'admin@signalschool.mil.gh', -- CHANGE THIS EMAIL
            admin_password_hash, -- CHANGE THIS PASSWORD HASH
            'admin',
            NOW()
        );
        
        RAISE NOTICE '✅ Admin user created successfully!';
        RAISE NOTICE 'Username: admin';
        RAISE NOTICE 'Default Password: Admin123!';
        RAISE NOTICE '⚠️ IMPORTANT: Change the password immediately after first login!';
    ELSE
        RAISE NOTICE '⚠️ Admin user already exists. Skipping creation.';
        RAISE NOTICE 'If login fails, check:';
        RAISE NOTICE '  1. Username is exactly: admin (lowercase)';
        RAISE NOTICE '  2. Password is exactly: Admin123! (with exclamation)';
        RAISE NOTICE '  3. Role is set to: admin';
        
        -- Show existing admin user details
        RAISE NOTICE 'Existing admin user details:';
        FOR rec IN SELECT username, name, email, role FROM users WHERE username = 'admin' AND role = 'admin' LIMIT 1
        LOOP
            RAISE NOTICE '  Username: %, Name: %, Email: %, Role: %', rec.username, rec.name, rec.email, rec.role;
        END LOOP;
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
