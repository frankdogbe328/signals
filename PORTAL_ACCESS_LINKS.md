# 🔗 Portal Access Links - Complete Guide

## 📍 Local Hosting (Development/Testing)

If you're running the server locally using `START_LOCAL_SERVER.bat` or `python -m http.server`:

### Base URL:
```
http://localhost:8000
```

### For Network Access (Mobile/Laptop on same WiFi):
```
http://YOUR_IP_ADDRESS:8000
```
*(Replace YOUR_IP_ADDRESS with your computer's IP - shown in server window)*

---

## 🎓 Student Portals

### 1. Student LMS Portal (Learning Materials)
**Local:**
```
http://localhost:8000/student-dashboard.html
```

**Network:**
```
http://YOUR_IP:8000/student-dashboard.html
```

**Features:**
- View learning materials uploaded by lecturers
- Register for subjects
- Track learning progress
- Download materials
- Mark materials as completed

---

### 2. Student Exam Portal (Take Exams & View Results)
**Local:**
```
http://localhost:8000/exam-portal/student-exam-portal.html
```

**Network:**
```
http://YOUR_IP:8000/exam-portal/student-exam-portal.html
```

**Features:**
- Take timed exams
- View exam results (Mid-Semester & Final Semester)
- View detailed exam feedback
- Download results as PDF

---

## 👨‍🏫 Lecturer Portals

### 1. Lecturer LMS Portal (Upload Materials)
**Local:**
```
http://localhost:8000/lecturer-dashboard.html
```

**Network:**
```
http://YOUR_IP:8000/lecturer-dashboard.html
```

**Features:**
- Upload learning materials (PDFs, Word, PowerPoint, Images, Text)
- Register for subjects you teach
- Organize materials by class and category
- Track student progress

---

### 2. Lecturer Exam Portal (Create & Manage Exams)
**Local:**
```
http://localhost:8000/exam-portal/lecturer-exam-dashboard.html
```

**Network:**
```
http://YOUR_IP:8000/exam-portal/lecturer-exam-dashboard.html
```

**Features:**
- Create exams and quizzes
- Add questions (Multiple Choice, True/False, Short Answer, Essay)
- Set time limits
- View exam statistics
- Release results manually

---

## 👨‍💼 Admin Portal

### Admin Portal (Result Management & System Control)
**Local:**
```
http://localhost:8000/admin-portal.html
```

**Network:**
```
http://YOUR_IP:8000/admin-portal.html
```

**Features:**
- Release mid-semester results
- Release final semester results
- Manage grade thresholds
- View database statistics
- Manual score entry
- View all student results

---

## 🔐 Login Pages

### Student Login Page (Students Only)
**Local:**
```
http://localhost:8000/student-login.html
```

**Network:**
```
http://YOUR_IP:8000/student-login.html
```

**Features:**
- Student-only login (no role selection)
- Choose LMS Portal or Exam Portal
- Direct access to student dashboards

---

### Lecturer Login Page (Lecturers Only)
**Local:**
```
http://localhost:8000/lecturer-login.html
```

**Network:**
```
http://YOUR_IP:8000/lecturer-login.html
```

**Features:**
- Lecturer-only login (no role selection)
- Choose LMS Portal or Exam Portal
- Direct access to lecturer dashboards

---

### Admin Login Page (Admin Only)
**Local:**
```
http://localhost:8000/admin-login.html
```

**Network:**
```
http://YOUR_IP:8000/admin-login.html
```

**Features:**
- Admin-only login
- Secure admin access
- Direct access to admin portal

---

### Main Landing Page
**Local:**
```
http://localhost:8000/index.html
```

**Network:**
```
http://YOUR_IP:8000/index.html
```

**Features:**
- Landing page with links to all portals
- Student registration
- Links to Student, Lecturer, and Admin login pages

---

## 🌐 Production URLs (Vercel/Deployed)

If your site is deployed on Vercel or another hosting service:

### Base URL:
```
https://your-project-name.vercel.app
```
*(Replace with your actual Vercel URL)*

### All Portals (replace base URL):
- **Student LMS:** `/student-dashboard.html`
- **Student Exam:** `/exam-portal/student-exam-portal.html`
- **Lecturer LMS:** `/lecturer-dashboard.html`
- **Lecturer Exam:** `/exam-portal/lecturer-exam-dashboard.html`
- **Admin Portal:** `/admin-portal.html`
- **Main Login:** `/index.html`
- **Admin Login:** `/admin-login.html`

---

## 📱 Quick Access Summary

### For Students:
1. **Login:** `http://localhost:8000/student-login.html`
2. **Learning Materials:** `http://localhost:8000/student-dashboard.html`
3. **Exams & Results:** `http://localhost:8000/exam-portal/student-exam-portal.html`

### For Lecturers:
1. **Login:** `http://localhost:8000/lecturer-login.html`
2. **Upload Materials:** `http://localhost:8000/lecturer-dashboard.html`
3. **Create Exams:** `http://localhost:8000/exam-portal/lecturer-exam-dashboard.html`

### For Admins:
1. **Login:** `http://localhost:8000/admin-login.html`
2. **Admin Portal:** `http://localhost:8000/admin-portal.html`

---

## 🔍 Finding Your IP Address (For Network Access)

### Windows:
1. Open PowerShell or Command Prompt
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your network adapter
4. Example: `192.168.1.100`

### Share with Students:
```
http://192.168.1.100:8000
```
*(Replace with your actual IP)*

---

## ✅ Quick Test Checklist

- [ ] Start local server (`START_LOCAL_SERVER.bat`)
- [ ] Open `http://localhost:8000/index.html`
- [ ] Login as student → Should redirect to student dashboard
- [ ] Login as lecturer → Should redirect to lecturer dashboard
- [ ] Login as admin → Should redirect to admin portal
- [ ] Test exam portal links
- [ ] Test logout → Should redirect to correct login page

---

## 📝 Notes

- **Localhost:** Only accessible on your computer
- **Network IP:** Accessible on all devices on same WiFi network
- **Port:** Default is `8000`, change if needed
- **HTTPS:** Production URLs use HTTPS, local uses HTTP
- **Mobile Access:** Use network IP address on mobile devices

---

**Last Updated:** January 2026
