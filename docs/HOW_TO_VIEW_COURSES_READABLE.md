# How to View Courses as Readable Text in Supabase

## Problem
The `courses` column in the `users` table is stored as JSONB (JSON Binary), which displays as a "box" or JSON object in the Supabase dashboard, making it hard to read.

## Solution
Run the SQL script `supabase-courses-readable-view.sql` to create a view that displays courses as readable comma-separated text.

## Steps

### 1. Run the SQL Script
1. Go to your Supabase Dashboard
2. Click **SQL Editor** → **New Query**
3. Copy and paste the contents of `supabase-courses-readable-view.sql`
4. Click **Run** (or press Ctrl+Enter)

### 2. Use the View
After running the script, you'll have two options:

#### Option A: Use the View (Easiest)
1. Go to **Table Editor**
2. You'll see a new table called **`users_with_readable_courses`**
3. Click on it to see all users with courses displayed as readable text in the `courses_display` column

#### Option B: Use the Function in Queries
You can use the `format_courses()` function in any SQL query:

```sql
SELECT 
    username,
    name,
    class,
    format_courses(courses) as courses
FROM users
WHERE role = 'student';
```

### 3. Example Queries

**View all students with readable courses:**
```sql
SELECT 
    username,
    name,
    class,
    courses_display
FROM users_with_readable_courses
WHERE role = 'student'
ORDER BY class, name;
```

**View students by class with courses:**
```sql
SELECT 
    class,
    name,
    courses_display
FROM users_with_readable_courses
WHERE role = 'student' AND class = 'signal-basic-beginner'
ORDER BY name;
```

**Count courses per student:**
```sql
SELECT 
    username,
    name,
    courses_display,
    jsonb_array_length(courses_jsonb) as course_count
FROM users_with_readable_courses
WHERE role = 'student';
```

## What the View Does

- **`courses_display`**: Shows courses as comma-separated text (e.g., "Telecom, Electronics, Antenna")
- **`courses_jsonb`**: Keeps the original JSONB format for reference
- **Handles empty arrays**: Shows "No courses registered" when empty

## Benefits

✅ **Readable**: Courses display as text instead of JSON box  
✅ **Searchable**: You can search for specific courses in the text  
✅ **Sortable**: Can sort by courses in the view  
✅ **Non-destructive**: Original JSONB data is preserved  

## Notes

- The view is read-only (you can't edit through it)
- To update courses, edit the `users` table directly
- The view automatically updates when the `users` table changes

