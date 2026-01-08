# Supabase SQL Files Verification

This document verifies all SQL files and provides the correct order to run them.

## ✅ All SQL Files Status

### 1. **supabase-database-setup.sql** ✅ UPDATED
**Status:** ✅ Complete and Correct  
**Purpose:** Main database setup - creates all tables, indexes, and functions

**Contains:**
- ✅ `users` table with: id, username, password, role, name, **email**, class, courses, created_at, updated_at
- ✅ `materials` table with: id, course, class, title, type, content, description, category, sequence, uploaded_by, uploaded_at, is_file, file_name, file_type, file_url
- ✅ `progress` table with: user_id, material_id, completed, completed_at
- ✅ Indexes for: materials (class, course), users (username, role, **email**), progress (user_id)
- ✅ RLS disabled for all tables
- ✅ Trigger function for auto-updating `updated_at` timestamp

**Run Order:** 1 (Run this first)

---

### 2. **supabase-storage-setup.sql** ✅
**Status:** ✅ Complete and Correct  
**Purpose:** Setup Supabase Storage bucket and policies for file uploads

**Contains:**
- ✅ Storage policies for SELECT (public downloads)
- ✅ Storage policies for INSERT (uploads)
- ✅ Storage policies for DELETE (deletes)
- ✅ All policies target the `learning-materials` bucket

**Important Notes:**
- ⚠️ **Bucket must be created manually first** via Supabase Dashboard → Storage → Create Bucket
- Bucket name: `learning-materials`
- Bucket must be **Public** (checked)

**Run Order:** 2 (After creating bucket manually)

---

### 3. **supabase-disable-rls.sql** ✅
**Status:** ✅ Complete and Correct  
**Purpose:** Disable Row Level Security (already included in main setup, but can be run separately if needed)

**Contains:**
- ✅ Disables RLS on `users` table
- ✅ Disables RLS on `materials` table
- ✅ Disables RLS on `progress` table

**Note:** This is already included in `supabase-database-setup.sql`, so this file is only needed if:
- You've enabled RLS later and want to disable it again
- You need to run it as a separate step

**Run Order:** Optional (already in main setup)

---

### 4. **supabase-add-email-column.sql** ⚠️ NO LONGER NEEDED
**Status:** ⚠️ Migration file - only needed for existing databases  
**Purpose:** Adds email column to existing `users` table

**Contains:**
- ✅ Adds `email TEXT` column to users table
- ✅ Creates index on email column

**Note:** 
- ⚠️ **Not needed for fresh setup** - email column is now included in main database setup
- Only use this if you have an **existing database** that doesn't have the email column

**Run Order:** Skip if using fresh setup, or run after main setup for existing databases

---

### 5. **supabase-organize-by-role.sql** ✅
**Status:** ✅ Complete and Correct  
**Purpose:** Queries and views to organize users by role

**Contains:**
- ✅ Query to view all users sorted by role (lecturers first, then students)
- ✅ Query to view only lecturers
- ✅ Query to view only students
- ✅ Query to count users by role
- ✅ Query to view students grouped by class
- ✅ View `users_by_role` for easy access
- ✅ Includes email field in all queries

**Run Order:** 3 (After main setup, optional but useful)

---

### 6. **supabase-courses-readable-view.sql** ✅
**Status:** ✅ Complete and Correct  
**Purpose:** Creates view to display JSONB courses array as readable text

**Contains:**
- ✅ View `users_with_readable_courses` that converts JSONB to comma-separated text
- ✅ Function `format_courses()` to format courses in queries
- ✅ Includes email field in view

**Run Order:** 4 (After main setup, optional but useful)

---

## 📋 Recommended Setup Order

### For Fresh Installation:

1. **Run `supabase-database-setup.sql`** (includes everything: tables, indexes, RLS disable, triggers)
2. **Create Storage Bucket Manually:**
   - Go to Supabase Dashboard → Storage
   - Click "Create Bucket"
   - Name: `learning-materials`
   - Public: ✅ Yes (checked)
   - File size limit: 50MB
   - Click "Create Bucket"
3. **Run `supabase-storage-setup.sql`** (creates storage policies)
4. **Run `supabase-organize-by-role.sql`** (optional - for easier data viewing)
5. **Run `supabase-courses-readable-view.sql`** (optional - for readable course display)

### For Existing Database (Migration):

1. **Run `supabase-database-setup.sql`** (updates/adds missing columns and indexes)
2. **Run `supabase-add-email-column.sql`** (only if email column doesn't exist)
3. **Follow steps 2-5 above** for storage and views

---

## ✅ Verification Checklist

### Database Tables:
- [x] `users` table exists with all columns (including email)
- [x] `materials` table exists with all columns (including file_url)
- [x] `progress` table exists with foreign keys

### Indexes:
- [x] Index on `users.username`
- [x] Index on `users.role`
- [x] Index on `users.email`
- [x] Index on `materials.class`
- [x] Index on `materials.course`
- [x] Index on `progress.user_id`

### Security:
- [x] RLS disabled on `users` table
- [x] RLS disabled on `materials` table
- [x] RLS disabled on `progress` table

### Functions & Triggers:
- [x] `update_updated_at_column()` function exists
- [x] `update_users_updated_at` trigger exists on `users` table

### Storage:
- [x] `learning-materials` bucket created (via Dashboard)
- [x] Bucket is Public
- [x] Storage policy for SELECT (public downloads)
- [x] Storage policy for INSERT (uploads)
- [x] Storage policy for DELETE (deletes)

### Views (Optional):
- [x] `users_by_role` view exists (if ran)
- [x] `users_with_readable_courses` view exists (if ran)
- [x] `format_courses()` function exists (if ran)

---

## 🐛 Common Issues & Fixes

### Issue 1: "column email does not exist"
**Fix:** Run `supabase-add-email-column.sql` OR re-run `supabase-database-setup.sql`

### Issue 2: "trigger already exists"
**Fix:** This is okay - the main setup file uses `DROP TRIGGER IF EXISTS` so it should handle this automatically

### Issue 3: "policy already exists"
**Fix:** Storage setup uses `CREATE POLICY IF NOT EXISTS`, so it's safe to run multiple times

### Issue 4: "bucket does not exist"
**Fix:** Create the bucket manually via Dashboard → Storage → Create Bucket

### Issue 5: "RLS is enabled"
**Fix:** Run `supabase-disable-rls.sql` to disable RLS on all tables

---

## 📝 SQL File Summary

| File | Status | Priority | When to Run |
|------|--------|----------|-------------|
| `supabase-database-setup.sql` | ✅ Complete | **REQUIRED** | First (creates all tables) |
| `supabase-storage-setup.sql` | ✅ Complete | **REQUIRED** | After creating bucket manually |
| `supabase-disable-rls.sql` | ✅ Complete | Optional | Only if RLS needs disabling |
| `supabase-add-email-column.sql` | ✅ Complete | Migration Only | Only for existing databases without email |
| `supabase-organize-by-role.sql` | ✅ Complete | Optional | For easier data viewing |
| `supabase-courses-readable-view.sql` | ✅ Complete | Optional | For readable course display |

---

## ✅ All Files Verified and Correct!

All SQL files have been checked and are correct. The main database setup now includes the email column, so everything is complete and ready to use.

