-- Supabase SQL to Display Courses as Readable Text
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates a view that converts the JSONB courses array to readable text

-- Create a view that displays courses as comma-separated text
CREATE OR REPLACE VIEW users_with_readable_courses AS
SELECT 
    id,
    username,
    password,
    role,
    name,
    email,
    class,
    -- Convert JSONB array to readable text
    CASE 
        WHEN courses IS NULL OR courses::text = '[]' THEN 'No courses registered'
        WHEN jsonb_array_length(courses) = 0 THEN 'No courses registered'
        ELSE array_to_string(
            ARRAY(
                SELECT jsonb_array_elements_text(courses)
            ),
            ', '
        )
    END as courses_display,
    courses as courses_jsonb, -- Keep original JSONB for reference
    created_at,
    updated_at
FROM users
ORDER BY role, name;

-- You can now query this view to see courses as readable text:
-- SELECT * FROM users_with_readable_courses;

-- To see only students with their courses:
-- SELECT username, name, class, courses_display FROM users_with_readable_courses WHERE role = 'student';

-- To update the users table to show courses in a readable format in the dashboard:
-- You can use this query in the Table Editor or create a computed column
-- But the view above is the easiest solution

-- Alternative: Create a function to format courses
CREATE OR REPLACE FUNCTION format_courses(courses_jsonb JSONB)
RETURNS TEXT AS $$
BEGIN
    IF courses_jsonb IS NULL OR courses_jsonb::text = '[]' THEN
        RETURN 'No courses';
    END IF;
    
    IF jsonb_array_length(courses_jsonb) = 0 THEN
        RETURN 'No courses';
    END IF;
    
    RETURN array_to_string(
        ARRAY(
            SELECT jsonb_array_elements_text(courses_jsonb)
        ),
        ', '
    );
END;
$$ LANGUAGE plpgsql;

-- Now you can use the function in queries:
-- SELECT username, name, format_courses(courses) as courses FROM users WHERE role = 'student';

