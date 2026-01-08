# How to Clear All Test Data from Database

This guide will help you clear all test data from Supabase to prepare for production use.

## ⚠️ WARNING
**This will delete ALL data:**
- All users (lecturers and students)
- All materials (uploaded files and content)
- All progress records
- All files in Supabase Storage

## Quick Method: Use the SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Clear Script
1. Open the file `supabase-clear-all-data-complete.sql` from this project
2. Copy **ALL** the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

This will:
- ✅ Delete all users
- ✅ Delete all materials
- ✅ Delete all progress records
- ✅ Delete all files from storage

### Step 3: Verify Everything is Cleared
After running, verify by running these queries:

```sql
-- Check user count (should be 0)
SELECT COUNT(*) as total_users FROM users;

-- Check materials count (should be 0)
SELECT COUNT(*) as total_materials FROM materials;

-- Check progress count (should be 0)
SELECT COUNT(*) as total_progress FROM progress;

-- Check storage files count (should be 0)
SELECT COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'learning-materials';
```

All counts should be **0**.

## Alternative: Clear Storage Files Manually

If the storage deletion in the SQL script doesn't work, you can delete files manually:

1. Go to **Supabase Dashboard** → **Storage**
2. Click on the `learning-materials` bucket
3. Select all files (or specific files)
4. Click **Delete** button

## After Clearing

✅ All test data is removed
✅ Database is clean and ready for production
✅ Storage is empty
✅ New users can register fresh accounts

## Notes

- **No backup is created** - make sure you don't need any of this data
- **Demo accounts are removed** - users will need to register new accounts
- **All uploaded files are deleted** - they cannot be recovered after deletion

---

## Quick Reference

**File to use:** `supabase-clear-all-data-complete.sql`

**Where to run it:** Supabase Dashboard → SQL Editor

**Time to complete:** Less than 1 minute

