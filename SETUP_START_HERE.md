# 🚀 Setup Guide - Start Here!

## ✅ Great News: Material Upload is Working Locally!

Since it's working locally, let's set up the complete system properly.

---

## 📋 Setup Order (Recommended)

### **Step 1: Database Setup (Supabase)** ⚠️ CRITICAL
**Do this FIRST - everything depends on it**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Run SQL Scripts (in order):**
   ```
   📁 lms/supabase-database-setup.sql
      → Creates users, materials, progress tables
   
   📁 lms/supabase-storage-setup.sql
      → Sets up file storage for materials
   
   📁 exam-portal/supabase-exam-tables.sql
      → Creates exam system tables
   
   📁 exam-portal/supabase-exam-migration-add-mid-semester.sql
      → Adds mid-semester column (if not done)
   ```

3. **Verify Tables Created:**
   - Check Supabase Table Editor
   - Should see: `users`, `materials`, `exams`, `questions`, etc.

---

### **Step 2: Create Admin User** 👤
**Required for admin portal access**

1. **Run SQL Script:**
   ```
   📁 lms/CREATE_ADMIN_USER_NOW.sql
   ```
   
2. **Or Create Manually:**
   - Go to Supabase → Authentication → Users
   - Create user with:
     - Email: your-admin@email.com
     - Password: (set secure password)
     - Role: admin (update in `users` table)

3. **Verify:**
   ```
   📁 lms/VERIFY_ADMIN_USER.sql
   ```

---

### **Step 3: Test Portals** 🧪

**Test in this order:**

#### **A. Student Portal** (Easiest - No special setup)
1. Start local server: `python -m http.server 8000`
2. Go to: `http://localhost:8000/index.html`
3. Register as student
4. Login
5. Test:
   - View materials
   - Register for subjects
   - View progress

#### **B. Lecturer Portal** (Already Working!)
1. Go to: `http://localhost:8000/lecturer-dashboard.html`
2. Register lecturer (needs registration code)
3. Login
4. Test:
   - ✅ Material upload (already working!)
   - Register for subjects
   - View analytics

#### **C. Admin Portal** (Requires Admin User)
1. Go to: `http://localhost:8000/admin-login.html`
2. Login with admin credentials
3. Test:
   - View all students
   - Manage results
   - Database statistics

---

## 🎯 Recommended Starting Point

### **Start with Student Portal** ✅

**Why:**
- ✅ Simplest to test
- ✅ No special setup needed
- ✅ Can register immediately
- ✅ Good for understanding the system

**Steps:**
1. ✅ Database setup (Step 1 above)
2. ✅ Start local server
3. ✅ Test student registration/login
4. ✅ Test viewing materials
5. ✅ Then move to lecturer/admin

---

## 💻 IDE Typing/Autocomplete Setup

### **Problem:** No code suggestions/typing in VS Code

### **Solution 1: Add JSDoc Comments** (Quick Fix)

I can add JSDoc comments to functions for better autocomplete:

```javascript
/**
 * Uploads material file to Supabase Storage
 * @param {string} course - Course/subject name
 * @param {string} classSelect - Class ID
 * @param {string} title - Material title
 * @param {string} type - Material type (file/text/video)
 * @param {string} description - Material description
 * @param {string} category - Material category
 * @param {number} sequence - Display order
 * @param {string|null} fileData - Base64 file data (if no URL)
 * @param {string} fileName - File name
 * @param {string} fileType - MIME type
 * @param {string|null} fileUrl - Supabase Storage URL
 * @returns {Promise<boolean>} Success status
 */
async function saveMaterialWithFile(...) { ... }
```

### **Solution 2: Create TypeScript Definitions** (Better)

Create `js/lecturer.d.ts` for full TypeScript support.

### **Solution 3: Use VS Code Extensions**

- **JavaScript and TypeScript Nightly** - Better JS support
- **JSDoc Tag Complete** - Autocomplete for JSDoc
- **IntelliSense for CSS** - CSS autocomplete

---

## 📝 Quick Setup Checklist

### **Essential Setup:**
- [ ] Supabase database tables created
- [ ] Storage bucket configured
- [ ] Admin user created
- [ ] Local server running
- [ ] Student portal tested
- [ ] Lecturer portal tested (✅ already working!)
- [ ] Admin portal tested

### **Optional Setup:**
- [ ] IDE typing/autocomplete configured
- [ ] JSDoc comments added
- [ ] TypeScript definitions created
- [ ] VS Code extensions installed

---

## 🚀 Next Steps

**Right Now:**
1. ✅ Material upload is working locally
2. ✅ Test student portal
3. ✅ Set up admin user
4. ✅ Test admin portal

**Then:**
1. ✅ Add IDE typing support (if you want)
2. ✅ Deploy to Vercel (when limit resets)
3. ✅ Test on live site

---

## 🎯 What Should We Do First?

**Recommendation:**
1. **Test Student Portal** → Verify full system works
2. **Set up Admin User** → Test admin features
3. **Add IDE Typing** → Better development experience
4. **Deploy to Vercel** → Make it live

**Which one do you want to start with?**

---

## 📚 Files Reference

- **Database Setup:** `lms/supabase-database-setup.sql`
- **Storage Setup:** `lms/supabase-storage-setup.sql`
- **Exam Tables:** `exam-portal/supabase-exam-tables.sql`
- **Admin User:** `lms/CREATE_ADMIN_USER_NOW.sql`
- **Local Server:** `START_LOCAL_SERVER.bat`

---

**Ready to start?** Tell me which step you want to begin with!
