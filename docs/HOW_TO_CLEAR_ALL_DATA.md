# How to Clear All Data from Supabase

This guide will help you clear all data from the Supabase database and storage to prepare for testing tomorrow.

## ⚠️ WARNING
**This will delete ALL data:**
- All users (including demo accounts)
- All materials (uploaded files and content)
- All progress records
- All files in Supabase Storage

## Step 1: Clear Database Tables

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-clear-all-data.sql`
4. Click **Run** (or press Ctrl+Enter)

This will delete:
- All users from the `users` table
- All materials from the `materials` table
- All progress from the `progress` table

## Step 2: Clear Storage Files (Optional but Recommended)

If you uploaded files, they are stored in Supabase Storage and need to be deleted separately:

### Option A: Delete via Dashboard (Easier)
1. Go to **Supabase Dashboard** → **Storage**
2. Click on the `learning-materials` bucket
3. Select all files (or specific files)
4. Click **Delete** button

### Option B: Delete via SQL (Faster for many files)
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Run this SQL:
```sql
-- Delete all files from learning-materials bucket
-- Note: This requires additional setup in Supabase
-- Easier to delete via Dashboard
```

**Recommendation:** Use Option A (Dashboard) for deleting storage files.

## Step 3: Verify Everything is Cleared

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check user count (should be 0)
SELECT COUNT(*) as total_users FROM users;

-- Check materials count (should be 0)
SELECT COUNT(*) as total_materials FROM materials;

-- Check progress count (should be 0)
SELECT COUNT(*) as total_progress FROM progress;
```

## After Clearing

After running the SQL:
1. ✅ All users are deleted (including demo accounts)
2. ✅ All materials are deleted
3. ✅ All progress records are deleted
4. ✅ The system is ready for fresh testing tomorrow

**Note:** Demo credentials will still appear on the login page (`index.html`), but the actual accounts won't exist in Supabase. Users will need to register new accounts.

## Quick SQL Script

For convenience, use `supabase-clear-all-data.sql` which contains all the DELETE statements ready to run.

---

## Alternative: Clear Only Demo Accounts

If you want to keep some real accounts and only remove demo accounts, use `supabase-clear-demo-accounts-only.sql` instead. This will:
- Delete only accounts with usernames: `lecturer1`, `student1`, `lecturer`, `student`, `demo_lecturer`, `demo_student`
- Keep all other accounts
- Delete materials uploaded by demo accounts
- Delete progress for demo accounts

