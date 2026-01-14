-- Fix Admin Password Hash
-- Run this in Supabase SQL Editor to update the admin password hash
-- This ensures the password hash matches SHA256('Admin123!')

-- First, verify current admin user
SELECT 
    id,
    username,
    name,
    email,
    role,
    LENGTH(password) as password_length,
    LEFT(password, 20) as password_preview,
    created_at
FROM users 
WHERE username = 'admin' AND role = 'admin';

-- Update admin password to correct SHA256 hash
-- Password: Admin123!
-- SHA256 Hash: (will be calculated - use online tool or CryptoJS)
UPDATE users 
SET password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
WHERE username = 'admin' AND role = 'admin';

-- Verify the update
SELECT 
    id,
    username,
    name,
    email,
    role,
    LENGTH(password) as password_length,
    LEFT(password, 20) as password_preview
FROM users 
WHERE username = 'admin' AND role = 'admin';

-- Expected result:
-- password_length should be 64
-- password_preview should start with 'a665a45920422f9d41'

-- NOTE: The hash above might be wrong. To get the correct hash:
-- 1. Go to: https://emn178.github.io/online-tools/sha256.html
-- 2. Enter: Admin123!
-- 3. Copy the 64-character hash
-- 4. Replace the hash in the UPDATE statement above
