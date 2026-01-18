# System Testing Guide

## Step 1: Clear the Database

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Clearing Script**
   - Open the file: `lms/CLEAR_ALL_DATA_FOR_TESTING.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Data is Cleared**
   - Check the results at the bottom
   - All counts should be 0

## Step 2: Test the System

### Option A: Browser Console Test (Recommended)

1. **Open your application**
   - Open `index.html` or any portal page in your browser
   - Open Developer Tools (F12)
   - Go to the "Console" tab

2. **Load the test script**
   - Open the file: `test-system.js`
   - Copy the entire contents
   - Paste into the browser console
   - Press Enter

3. **Review test results**
   - The script will run automatically
   - Check the console output for test results
   - All tests should show ✅ (green checkmarks)

### Option B: Manual Testing

1. **Test Registration**
   - Go to the registration page
   - Register a new student
   - Verify student_index is assigned (e.g., SB-001)

2. **Test Admin Portal**
   - Login as admin
   - Check if users load correctly
   - Try assigning student indices
   - Test manual score entry

3. **Test Student Index Order**
   - Register multiple students in the same class
   - Verify they get sequential indices (001, 002, 003...)
   - Check that order matches registration time

## Step 3: Check for Errors

### Browser Console
- Open Developer Tools (F12)
- Check the Console tab for any red error messages
- Check the Network tab for failed requests

### Common Issues to Check:
- ✅ Supabase connection working
- ✅ No CSP (Content Security Policy) errors
- ✅ No "column does not exist" errors
- ✅ Student indices assigned correctly
- ✅ All functions loading properly

## Quick Test Commands

Run these in the browser console to test specific features:

```javascript
// Test Supabase connection
getSupabaseClient()

// Test student index generation
window.generateNextStudentIndex('signals-basic')

// Test loading users
loadAllUsers()

// Run full test suite
runSystemTests()
```

## Expected Results After Clearing

- ✅ Users table: 0 records
- ✅ Materials table: 0 records
- ✅ Exams table: 0 records
- ✅ All storage files: deleted
- ✅ System ready for fresh testing

## Next Steps After Testing

1. Create an admin user (if needed)
2. Register test students
3. Test the full workflow
4. Verify student indices are assigned correctly
