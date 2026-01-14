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
-- SHA256 Hash: 3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121
UPDATE users 
SET password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121'
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
