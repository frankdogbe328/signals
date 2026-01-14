# Admin Login Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Invalid username, password, or you do not have admin access"

This error can occur for several reasons. Follow these steps to diagnose and fix:

---

## Step 1: Verify Admin User Exists

Run this SQL query in Supabase SQL Editor:

```sql
SELECT id, username, name, email, role, created_at 
FROM users 
WHERE role = 'admin';
```

**Expected Result:** Should return one row with username 'admin'

**If no results:**
- Admin user hasn't been created yet
- **Solution:** Run `lms/supabase-admin-support.sql` in Supabase SQL Editor

---

## Step 2: Verify Password Hash

The password should be stored as a SHA256 hash (64 characters).

Run this query:

```sql
SELECT 
    username,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_preview
FROM users 
WHERE username = 'admin' AND role = 'admin';
```

**Expected:**
- `password_length` should be 64
- `password_preview` should start with letters/numbers (hex format)

**If password_length is not 64:**
- Password is not hashed correctly
- **Solution:** See "Fix Password Hash" below

---

## Step 3: Verify Login Credentials

**Correct Credentials:**
- **Username:** `admin` (exactly, case-sensitive)
- **Password:** `Admin123!` (exactly, case-sensitive)

**Common Mistakes:**
- Extra spaces before/after username
- Wrong case (Admin vs admin)
- Wrong password (Admin123 vs Admin123!)
- Special characters not included

---

## Step 4: Check Browser Console

Open browser Developer Tools (F12) and check Console tab for errors:

1. Go to `admin-login.html`
2. Open Developer Tools (F12)
3. Click Console tab
4. Try to login
5. Look for error messages

**Common Console Errors:**
- `Supabase client not available` → Check Supabase configuration
- `getUserFromSupabase function not available` → Check if `js/supabase-helpers.js` is loaded
- `No user found` → Admin user doesn't exist in database

---

## Step 5: Fix Password Hash (If Needed)

If the password hash is incorrect, update it manually:

### Option 1: Use Online SHA256 Generator
1. Go to: https://emn178.github.io/online-tools/sha256.html
2. Enter: `Admin123!`
3. Copy the hash (64 characters)
4. Run this SQL:

```sql
UPDATE users 
SET password = 'PASTE_HASH_HERE'
WHERE username = 'admin' AND role = 'admin';
```

### Option 2: Use JavaScript Console
1. Open browser console (F12)
2. Make sure CryptoJS is loaded (or use online tool)
3. Run: `CryptoJS.SHA256('Admin123!').toString()`
4. Copy the result
5. Update in Supabase:

```sql
UPDATE users 
SET password = 'PASTE_HASH_HERE'
WHERE username = 'admin' AND role = 'admin';
```

---

## Step 6: Verify Supabase Configuration

Check that `js/supabase-config.js` has correct values:

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

**To find these:**
1. Go to Supabase Dashboard
2. Click Settings → API
3. Copy Project URL and anon/public key

---

## Step 7: Recreate Admin User (Last Resort)

If nothing works, delete and recreate:

```sql
-- Delete existing admin user
DELETE FROM users WHERE username = 'admin' AND role = 'admin';

-- Then run the full script: lms/supabase-admin-support.sql
```

---

## Quick Verification Checklist

- [ ] SQL script `lms/supabase-admin-support.sql` has been run
- [ ] Admin user exists in database (verified with SELECT query)
- [ ] Password hash is 64 characters long
- [ ] Username is exactly: `admin` (lowercase)
- [ ] Password is exactly: `Admin123!` (with exclamation mark)
- [ ] Supabase configuration is correct
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

---

## Still Not Working?

1. **Check Network Tab:**
   - Open Developer Tools → Network tab
   - Try to login
   - Look for failed requests to Supabase
   - Check response status codes

2. **Verify Database Connection:**
   - Try logging in as a student/lecturer
   - If that works, issue is admin-specific
   - If that doesn't work, issue is database connection

3. **Check Row Level Security (RLS):**
   - In Supabase Dashboard → Authentication → Policies
   - Make sure RLS is disabled or policies allow admin access

---

## Contact Support

If none of these solutions work, provide:
- Screenshot of browser console errors
- Result of verification SQL queries
- Supabase project URL (without credentials)
- Browser and version you're using
