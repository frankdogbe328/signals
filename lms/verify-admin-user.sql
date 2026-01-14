-- Verify Admin User Setup
-- Run this in Supabase SQL Editor to check if admin user exists and verify credentials

-- Check if admin user exists
SELECT 
    id,
    username,
    name,
    email,
    role,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_preview,
    created_at
FROM users 
WHERE role = 'admin';

-- Check if admin user exists with username 'admin'
SELECT 
    id,
    username,
    name,
    email,
    role,
    created_at
FROM users 
WHERE username = 'admin' AND role = 'admin';

-- Check password hash format (should be 64 characters for SHA256)
SELECT 
    username,
    role,
    CASE 
        WHEN LENGTH(password) = 64 AND password ~ '^[a-f0-9]{64}$' THEN 'Valid SHA256 hash'
        WHEN LENGTH(password) < 20 THEN 'Possible plaintext password'
        ELSE 'Unknown format'
    END as password_status,
    LENGTH(password) as password_length
FROM users 
WHERE role = 'admin';

-- If admin user doesn't exist, you need to run: lms/supabase-admin-support.sql
-- If password is not hashed correctly, you may need to update it manually

-- To manually update admin password hash (use this if needed):
-- UPDATE users 
-- SET password = 'YOUR_SHA256_HASH_HERE'
-- WHERE username = 'admin' AND role = 'admin';

-- To verify the correct SHA256 hash for 'Admin123!', you can use an online SHA256 generator
-- or run this in JavaScript console: CryptoJS.SHA256('Admin123!').toString()
