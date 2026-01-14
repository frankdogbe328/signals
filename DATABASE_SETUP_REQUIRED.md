# Database Setup - Required SQL Scripts

## ⚠️ IMPORTANT: Run These Scripts in Order

All SQL scripts must be run in your Supabase SQL Editor. Follow the order below:

---

## 1. Admin Support (REQUIRED for Admin Portal)

**File:** `lms/supabase-admin-support.sql`

**What it does:**
- Creates admin user account
- Adds admin role support
- Creates indexes for better performance

**After running:**
- **Username:** `admin`
- **Password:** `Admin123!` ⚠️ **CHANGE IMMEDIATELY AFTER FIRST LOGIN!**
- **Email:** Update to your admin email

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste contents of `lms/supabase-admin-support.sql`
4. Click "Run" or press F5
5. Verify admin user was created

---

## 2. LMS Database Tables (If Not Already Done)

**Files:**
- `lms/supabase-database-setup.sql` - Main database tables
- `lms/supabase-storage-setup.sql` - File storage setup

**What it does:**
- Creates users table
- Creates materials table
- Sets up storage buckets for file uploads
- Creates necessary indexes

**Run if:**
- This is a fresh installation
- Database tables don't exist yet

---

## 3. Exam Portal Tables (If Not Already Done)

**File:** `exam-portal/supabase-exam-tables.sql`

**What it does:**
- Creates exams table
- Creates questions table
- Creates student_exam_attempts table
- Creates student_responses table
- Creates exam_grades table
- Creates indexes and triggers

**Run if:**
- Exam portal hasn't been set up yet
- Exam tables don't exist

---

## Quick Setup Checklist

- [ ] Run `lms/supabase-database-setup.sql` (if not done)
- [ ] Run `lms/supabase-storage-setup.sql` (if not done)
- [ ] Run `exam-portal/supabase-exam-tables.sql` (if not done)
- [ ] Run `lms/supabase-admin-support.sql` (REQUIRED for admin)
- [ ] Verify admin user was created
- [ ] Login with admin credentials
- [ ] Change admin password immediately

---

## Verification Queries

After running scripts, verify setup with these queries:

```sql
-- Check if admin user exists
SELECT id, username, name, email, role 
FROM users 
WHERE role = 'admin';

-- Check if exam tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('exams', 'questions', 'student_exam_attempts', 'exam_grades');

-- Check if LMS tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'materials');
```

---

## Troubleshooting

### Admin User Not Created
- Check if script ran without errors
- Verify users table exists
- Check if admin user already exists

### Tables Missing
- Run the corresponding setup script
- Check for SQL errors in Supabase SQL Editor
- Verify table names match

### Permission Errors
- Ensure you have proper Supabase permissions
- Check RLS (Row Level Security) policies if enabled

---

**Note:** All scripts use `IF NOT EXISTS` checks, so running them multiple times is safe.
