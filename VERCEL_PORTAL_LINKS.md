# 🔗 Vercel Deployment - Portal Links

## 📍 Base URL Format
After deploying to Vercel, your base URL will be:
```
https://your-project-name.vercel.app
```
or
```
https://your-custom-domain.com
```

## 🔗 All Portal Links (Replace BASE_URL with your Vercel URL)

### 🔐 Admin Portals
- **Admin Login:** `BASE_URL/admin-login.html`
- **Admin Dashboard:** `BASE_URL/admin-portal.html`

### 👨‍🏫 Lecturer Portals (Hidden from Students)
- **Lecturer Login:** `BASE_URL/lecturer-login.html`
- **Lecturer Registration:** `BASE_URL/lecturer-register.html`
- **Lecturer LMS Portal:** `BASE_URL/lecturer-dashboard.html`
- **Lecturer Exam Portal:** `BASE_URL/exam-portal/lecturer-exam-dashboard.html`

### 👨‍🎓 Student Portals (Public)
- **Student Login/Registration:** `BASE_URL/index.html` or `BASE_URL/`
- **Student LMS Portal:** `BASE_URL/student-dashboard.html`
- **Student Exam Portal:** `BASE_URL/exam-portal/student-exam-portal.html`

### 📋 Quick Access Page
- **Portal Links Page:** `BASE_URL/PORTAL_LINKS.html`

---

## 🚀 Example URLs (Replace with your actual Vercel domain)

If your Vercel project is `signals-lms`, your URLs would be:

```
https://signals-lms.vercel.app/admin-login.html
https://signals-lms.vercel.app/lecturer-login.html
https://signals-lms.vercel.app/index.html
```

---

## 📱 How to Access After Deployment

1. **Deploy to Vercel** (if not already done)
2. **Get your Vercel URL** from Vercel dashboard
3. **Open `PORTAL_LINKS.html`** in your browser (it will auto-detect your base URL)
4. **Or use the direct links** above with your Vercel domain

---

## 🔒 Access Control

- **Students:** Can only access `index.html` (student login/registration)
- **Lecturers:** Must use `lecturer-login.html` (hidden from students)
- **Admin:** Must use `admin-login.html` (separate portal)

---

## 💡 Tip

Bookmark `PORTAL_LINKS.html` for quick access to all portals!
