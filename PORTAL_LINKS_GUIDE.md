# Portal Links and Access Guide

## 🔗 All Portal Links

### **Main Login/Registration**
- **URL:** `index.html` or root URL
- **Access:** Public (for login/student registration)
- **Features:**
  - Login for Admin, Lecturer, and Student
  - Student registration only
  - Lecturer registration link is hidden from students

---

### **1. Admin Portal** 🔐
- **URL:** `admin-portal.html`
- **Access:** Admin role only (one person)
- **Login As:** Select "Admin" in login form
- **Features:**
  - View all exam results by class, student, and lecturer
  - Filter results by class, subject, or student name
  - Release final results to student portal
  - View final grades summary by class
  - System statistics dashboard
  - **NO LMS or Exam Portal links** - Admin sees only admin functions

**Setup Required:**
1. Run `lms/supabase-admin-support.sql` in Supabase SQL Editor
2. Default credentials: username `admin`, password `Admin123!` (⚠️ CHANGE IMMEDIATELY!)

---

### **2. Lecturer LMS Portal** 📚
- **URL:** `lecturer-dashboard.html`
- **Access:** Lecturer role only
- **Login As:** Select "Lecturer" → Choose "LMS Portal"
- **Features:**
  - Upload learning materials
  - Manage materials by subject and class
  - Register for subjects
  - View analytics
  - Track student progress

---

### **3. Lecturer Exam Portal** 📝
- **URL:** `exam-portal/lecturer-exam-dashboard.html`
- **Access:** Lecturer role only
- **Login As:** Select "Lecturer" → Choose "Exam Portal"
- **Features:**
  - Create exams and quizzes
  - Add questions (Multiple Choice, True/False, Short Answer, Essay)
  - Import questions from Word/Excel
  - Set exam schedules and time limits
  - View exam statistics
  - Release exam results
  - Export results to PDF/Excel

---

### **4. Student LMS Portal** 📚
- **URL:** `student-dashboard.html`
- **Access:** Student role only
- **Login As:** Select "Student" → Choose "LMS Portal"
- **Features:**
  - View and download learning materials
  - Register for subjects
  - Track learning progress
  - Mark materials as completed

---

### **5. Student Exam Portal** 📝
- **URL:** `exam-portal/student-exam-portal.html`
- **Access:** Student role only
- **Login As:** Select "Student" → Choose "Exam Portal"
- **Features:**
  - View available exams
  - Take timed exams
  - View exam results (when released)
  - Track exam progress

---

### **6. Lecturer Registration** 🔒 (Restricted)
- **URL:** `lecturer-register.html`
- **Access:** Restricted - Requires registration code
- **Registration Code:** `LECTURER2026` (⚠️ CHANGE IN PRODUCTION!)
- **Hidden from:** Students cannot see this link
- **Features:**
  - Restricted lecturer registration
  - Requires special access code
  - Only authorized personnel can register

**How to Change Registration Code:**
Edit `js/lecturer-register.js` and change `LECTURER_REGISTRATION_CODE` variable.

---

## 🔐 Access Control Summary

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| **Admin** | Admin Portal only | LMS Portal, Exam Portal (admin doesn't need these) |
| **Lecturer** | LMS Portal, Exam Portal | Admin Portal, Student Portals |
| **Student** | LMS Portal, Exam Portal | Admin Portal, Lecturer Portals, Lecturer Registration |

---

## 📋 Database Setup Required

### **1. Admin Support (Required)**
Run this script to create admin user and enable admin role:

```sql
-- File: lms/supabase-admin-support.sql
-- Run in Supabase SQL Editor
```

**What it does:**
- Creates admin user (username: `admin`, password: `Admin123!`)
- Adds admin role support
- Creates index for role-based queries

**After running:**
1. Login with admin credentials
2. **CHANGE PASSWORD IMMEDIATELY**
3. Update email address

---

### **2. Exam Tables (Already Set Up)**
If not already done, run:
```sql
-- File: exam-portal/supabase-exam-tables.sql
```

---

### **3. LMS Tables (Already Set Up)**
If not already done, run:
```sql
-- File: lms/supabase-database-setup.sql
-- File: lms/supabase-storage-setup.sql
```

---

## 🚀 Quick Access Links

Copy and save these links:

### For Administrators:
- **Admin Portal:** `admin-portal.html`

### For Lecturers:
- **LMS Portal:** `lecturer-dashboard.html`
- **Exam Portal:** `exam-portal/lecturer-exam-dashboard.html`
- **Lecturer Registration:** `lecturer-register.html` (with code)

### For Students:
- **LMS Portal:** `student-dashboard.html`
- **Exam Portal:** `exam-portal/student-exam-portal.html`
- **Registration:** `index.html` (Student registration only)

---

## 🔒 Security Features

1. **Admin Portal:** 
   - Only accessible to admin role
   - No portal selection - goes directly to admin functions
   - Cannot access LMS/Exam portals from admin

2. **Lecturer Registration:**
   - Hidden link from main registration page
   - Requires registration code
   - Students cannot see or access this

3. **Role-Based Access:**
   - Each role has specific portal access
   - Admin cannot access lecturer/student portals
   - Students cannot access admin/lecturer portals

---

## ⚠️ Important Notes

1. **Admin Account:**
   - Only ONE admin person should use the admin portal
   - Change default password immediately
   - Keep admin credentials secure

2. **Registration Code:**
   - Change `LECTURER_REGISTRATION_CODE` in `js/lecturer-register.js`
   - Keep code secure and share only with authorized lecturers

3. **Database:**
   - Run `lms/supabase-admin-support.sql` to enable admin role
   - Admin user will be created automatically

---

## 📞 Support

For issues or questions about portal access, contact the system administrator.

**Developer:** Frank Kojo Dogbe | Co-developed by Solomon A. Nortey
