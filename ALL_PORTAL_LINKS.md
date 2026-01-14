# 🔗 Complete Portal Links Guide

## 📍 For Vercel Deployment

Replace `YOUR-VERCEL-URL` with your actual Vercel domain (e.g., `signals-lms.vercel.app`)

---

## 🔐 ADMIN PORTALS (Restricted - One Person Only)

### Admin Login
```
https://YOUR-VERCEL-URL/admin-login.html
```
**Default Credentials:**
- Username: `admin`
- Password: `Admin123!`
- ⚠️ **CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

### Admin Dashboard
```
https://YOUR-VERCEL-URL/admin-portal.html
```
**Features:**
- View all exam results by class, student, and lecturer
- Filter by class, subject, or student name
- Enter BFT (Battle Fitness Test) scores manually
- Release final results to students
- View final grades summary
- System statistics

---

## 👨‍🏫 LECTURER PORTALS (Hidden from Students)

### Lecturer Login
```
https://YOUR-VERCEL-URL/lecturer-login.html
```
**Note:** This link is NOT visible to students on the main login page

### Lecturer Registration
```
https://YOUR-VERCEL-URL/lecturer-register.html
```
**Registration Code:** `LECTURER2026`
- ⚠️ Change this code in production (edit `js/lecturer-register.js`)

### Lecturer LMS Portal
```
https://YOUR-VERCEL-URL/lecturer-dashboard.html
```
**Features:**
- Upload learning materials (PDFs, Word docs, images, PowerPoint)
- Organize materials by subject and class
- Register for subjects
- Track student progress
- View analytics

### Lecturer Exam Portal
```
https://YOUR-VERCEL-URL/exam-portal/lecturer-exam-dashboard.html
```
**Features:**
- Create exams and quizzes
- Add questions (Multiple Choice, True/False, Short Answer, Essay)
- Import questions from Word/Excel
- Set exam schedules and time limits
- View exam statistics
- Release exam results
- Export results to PDF/Excel

---

## 👨‍🎓 STUDENT PORTALS (Public Access)

### Student Login & Registration
```
https://YOUR-VERCEL-URL/index.html
```
or simply:
```
https://YOUR-VERCEL-URL/
```
**Features:**
- Student login
- Student registration
- Password reset

### Student LMS Portal
```
https://YOUR-VERCEL-URL/student-dashboard.html
```
**Features:**
- View and download learning materials
- Register for subjects
- Track learning progress
- Mark materials as completed

### Student Exam Portal
```
https://YOUR-VERCEL-URL/exam-portal/student-exam-portal.html
```
**Features:**
- View available exams
- Take timed exams
- View exam results (when released by lecturer)
- Track exam progress

---

## 📋 QUICK ACCESS PAGE

### Portal Links Page (Auto-Detects Your URL)
```
https://YOUR-VERCEL-URL/PORTAL_LINKS.html
```
**Features:**
- Shows all portal links in one place
- Auto-detects your base URL
- Clickable links to all portals
- Organized by role

---

## 🚀 Example URLs

If your Vercel project is named `signals-lms`, your URLs would be:

### Admin
- `https://signals-lms.vercel.app/admin-login.html`
- `https://signals-lms.vercel.app/admin-portal.html`

### Lecturer
- `https://signals-lms.vercel.app/lecturer-login.html`
- `https://signals-lms.vercel.app/lecturer-register.html`
- `https://signals-lms.vercel.app/lecturer-dashboard.html`
- `https://signals-lms.vercel.app/exam-portal/lecturer-exam-dashboard.html`

### Student
- `https://signals-lms.vercel.app/` (or `index.html`)
- `https://signals-lms.vercel.app/student-dashboard.html`
- `https://signals-lms.vercel.app/exam-portal/student-exam-portal.html`

### Quick Access
- `https://signals-lms.vercel.app/PORTAL_LINKS.html`

---

## 🔒 Access Control Summary

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| **Admin** | Admin Portal only | LMS Portal, Exam Portal |
| **Lecturer** | LMS Portal, Exam Portal | Admin Portal, Student Portals |
| **Student** | LMS Portal, Exam Portal | Admin Portal, Lecturer Portals |

---

## 📱 Mobile-Friendly

All portals are optimized for mobile devices and work seamlessly on:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktop computers

---

## 🔐 Security Features

1. **Role-Based Access Control**
   - Each role can only access their designated portals
   - Admin portal is completely separate
   - Lecturer login is hidden from students

2. **Restricted Registration**
   - Lecturer registration requires a code
   - Students can only register as students
   - Admin account must be created via SQL script

3. **Password Security**
   - Passwords are hashed (SHA256)
   - Change default admin password immediately
   - Use strong passwords

---

## ⚠️ Important Setup Notes

### 1. Admin Account Setup
Run this SQL script in Supabase SQL Editor:
```sql
-- File: lms/supabase-admin-support.sql
-- Creates admin user with default credentials
```

### 2. Change Default Passwords
- Admin: Change `Admin123!` immediately
- Lecturer Registration Code: Change `LECTURER2026` in `js/lecturer-register.js`

### 3. Database Setup
Ensure these SQL scripts have been run:
- `lms/supabase-database-setup.sql`
- `lms/supabase-storage-setup.sql`
- `exam-portal/supabase-exam-tables.sql`
- `lms/supabase-admin-support.sql`

---

## 💡 Tips

1. **Bookmark `PORTAL_LINKS.html`** for quick access to all portals
2. **Share lecturer login link** only with authorized lecturers
3. **Keep admin credentials secure** - only one person should have access
4. **Test all portals** after deployment to ensure everything works

---

## 📞 Support

For issues or questions about portal access, contact the system administrator.

**Developer:** Frank Kojo Dogbe | Co-developed by Solomon A. Nortey

---

## 🔄 Quick Reference Card

```
ADMIN:
  Login:    /admin-login.html
  Portal:   /admin-portal.html

LECTURER:
  Login:    /lecturer-login.html
  Register: /lecturer-register.html
  LMS:      /lecturer-dashboard.html
  Exam:     /exam-portal/lecturer-exam-dashboard.html

STUDENT:
  Login:    /index.html (or /)
  LMS:      /student-dashboard.html
  Exam:     /exam-portal/student-exam-portal.html

QUICK ACCESS:
  All Links: /PORTAL_LINKS.html
```

---

**Last Updated:** January 2026
