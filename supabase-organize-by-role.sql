-- Organize Users by Role - SQL Queries
-- Run these in Supabase SQL Editor to view users organized by role

-- 1. View all users sorted by role (Lecturers first, then Officers)
SELECT 
    id,
    username,
    name,
    email,
    role,
    class,
    courses,
    created_at
FROM users
ORDER BY 
    CASE role 
        WHEN 'lecturer' THEN 1 
        WHEN 'student' THEN 2 
    END,
    name ASC;

-- 2. View only Lecturers
SELECT 
    id,
    username,
    name,
    email,
    role,
    created_at
FROM users
WHERE role = 'lecturer'
ORDER BY name ASC;

-- 3. View only Students
SELECT 
    id,
    username,
    name,
    email,
    role,
    class,
    courses,
    created_at
FROM users
WHERE role = 'student'
ORDER BY class, name ASC;

-- 4. Count users by role
SELECT 
    role,
    COUNT(*) as total_users
FROM users
GROUP BY role
ORDER BY role;

-- 5. View students grouped by class
SELECT 
    class,
    COUNT(*) as total_students,
    STRING_AGG(name, ', ' ORDER BY name) as student_names
FROM users
WHERE role = 'student' AND class IS NOT NULL
GROUP BY class
ORDER BY class;

-- 6. Create a view for easy access (optional - makes it easier to query)
CREATE OR REPLACE VIEW users_by_role AS
SELECT 
    id,
    username,
    name,
    email,
    role,
    class,
    courses,
    created_at,
    updated_at
FROM users
ORDER BY 
    CASE role 
        WHEN 'lecturer' THEN 1 
        WHEN 'student' THEN 2 
    END,
    name ASC;

-- 7. View lecturers only (using the view)
SELECT * FROM users_by_role WHERE role = 'lecturer';

-- 8. View students only (using the view)
SELECT * FROM users_by_role WHERE role = 'student';

