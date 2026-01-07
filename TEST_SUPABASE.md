# Testing Supabase Integration

## ✅ If SQL Ran Successfully

If you ran the main SQL (`supabase-database-setup.sql`) and got "Success", you're ready to test!

## 🧪 Test Steps

### 1. Open the System
- Open `index.html` in your browser
- You should see the login page

### 2. Register a New Account
- Click "Register as Student" or "Register as Lecturer"
- Fill in the form
- Click "Register"
- **Expected:** Should redirect to dashboard

### 3. Check Supabase Database
- Go to Supabase Dashboard → Table Editor
- Click on `users` table
- **Expected:** You should see your new account

### 4. Test Login
- Logout and login again
- **Expected:** Should work and redirect to dashboard

### 5. Test Materials (Lecturer)
- As lecturer, upload a material
- Go to Supabase → `materials` table
- **Expected:** Material should appear in database

### 6. Test Cross-Device
- Open the same page on a different device/browser
- Login with the same account
- **Expected:** Should work! (This is the main benefit!)

## ⚠️ If You Get Permission Errors

If you see errors like:
- "permission denied"
- "new row violates row-level security policy"
- "RLS policy violation"

**Solution:** Run the `supabase-disable-rls.sql` file:
1. Go to Supabase SQL Editor
2. Open `supabase-disable-rls.sql`
3. Copy and paste the SQL
4. Click "Run"

## 🎉 Success Indicators

✅ Can register new accounts
✅ Can login
✅ Can upload materials (lecturer)
✅ Can view materials (student)
✅ Accounts work on different devices
✅ Data appears in Supabase tables

Let me know what happens when you test!

