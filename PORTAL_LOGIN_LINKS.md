# 🔐 Portal Login Links - Separate Login Pages

## ✅ Separate Login Pages Created!

Each role now has its own dedicated login page:

---

## 🎓 Student Portal Login

**URL:**
```
http://localhost:8000/student-login.html
```

**Network:**
```
http://YOUR_IP:8000/student-login.html
```

**Features:**
- ✅ Student-only login (no role selection needed)
- ✅ Choose between LMS Portal or Exam Portal
- ✅ Direct access to student dashboards

---

## 👨‍🏫 Lecturer Portal Login

**URL:**
```
http://localhost:8000/lecturer-login.html
```

**Network:**
```
http://YOUR_IP:8000/lecturer-login.html
```

**Features:**
- ✅ Lecturer-only login (no role selection needed)
- ✅ Choose between LMS Portal or Exam Portal
- ✅ Direct access to lecturer dashboards

---

## 👨‍💼 Admin Portal Login

**URL:**
```
http://localhost:8000/admin-login.html
```

**Network:**
```
http://YOUR_IP:8000/admin-login.html
```

**Features:**
- ✅ Admin-only login
- ✅ Secure admin access
- ✅ Direct access to admin portal

---

## 🏠 Main Landing Page

**URL:**
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

## 🔄 Logout Behavior

When users log out, they are automatically redirected to their role-specific login page:

- **Student logs out** → Redirects to `student-login.html`
- **Lecturer logs out** → Redirects to `lecturer-login.html`
- **Admin logs out** → Redirects to `admin-login.html`

---

## 📋 Quick Reference

| Role | Login Page | LMS Portal | Exam Portal |
|------|-----------|------------|-------------|
| **Student** | `student-login.html` | `student-dashboard.html` | `exam-portal/student-exam-portal.html` |
| **Lecturer** | `lecturer-login.html` | `lecturer-dashboard.html` | `exam-portal/lecturer-exam-dashboard.html` |
| **Admin** | `admin-login.html` | `admin-portal.html` | N/A |

---

## ✅ Benefits

1. **Clear Separation:** Each role has its own login page
2. **No Confusion:** No need to select role - page is role-specific
3. **Better Security:** Role-specific pages reduce login errors
4. **Better UX:** Users know exactly where to go
5. **Proper Redirects:** Logout takes users to their correct login page

---

**Last Updated:** January 2026
