# Admin User Setup Instructions

## Problem
The admin user doesn't exist in your Supabase database. Follow these steps to create it.

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Run the SQL Script

1. Open the file: `lms/CREATE_ADMIN_USER_NOW.sql`
2. Copy ALL the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

## Step 3: Verify the Result

After running the script, you should see a result table showing:
- `username`: admin
- `role`: admin
- `password_length`: 64
- `password_status`: ✅ CORRECT

If you see this, the admin user was created successfully!

## Step 4: Test Login

1. Go to: `admin-login.html`
2. Enter:
   - **Username**: `admin`
   - **Password**: `Admin123!`
3. Click "Login as Admin"

## Troubleshooting

### If you get an error about role constraint:
The script will automatically fix this, but if you still get an error, run this first:

```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check CASCADE;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('lecturer', 'student', 'admin'));
```

### If the admin user still doesn't work:
1. Check the browser console (F12) for errors
2. Verify the SQL script ran successfully
3. Make sure you're using:
   - Username: `admin` (lowercase, exactly)
   - Password: `Admin123!` (with capital A, capital A, and exclamation mark)

### Quick Verification Query:
Run this in Supabase SQL Editor to check if admin exists:

```sql
SELECT username, role, LENGTH(password) as pwd_len 
FROM users 
WHERE username = 'admin' AND role = 'admin';
```

If this returns a row with `pwd_len = 64`, the admin user exists and is ready to use.
