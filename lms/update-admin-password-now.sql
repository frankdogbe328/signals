-- QUICK FIX: Update Admin Password Hash
-- Run this NOW in Supabase SQL Editor to fix admin login

UPDATE users 
SET password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121'
WHERE username = 'admin' AND role = 'admin';

-- Verify the update
SELECT 
    username,
    name,
    role,
    LENGTH(password) as password_length,
    LEFT(password, 20) as password_preview,
    CASE 
        WHEN password = '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121' 
        THEN '✅ Password hash is CORRECT'
        ELSE '❌ Password hash is INCORRECT'
    END as status
FROM users 
WHERE username = 'admin' AND role = 'admin';

-- Expected result:
-- password_length: 64
-- password_preview: 3eb3fe66b31e3b4d10fa
-- status: ✅ Password hash is CORRECT
