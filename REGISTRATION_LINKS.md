# 📝 Registration Links Guide

## ✅ Separate Registration Pages Created!

Each role now has its own dedicated registration page:

---

## 🎓 Student Registration

**URL:**
```
http://localhost:8000/student-register.html
```

**Network:**
```
http://192.168.2.113:8000/student-register.html
```

**Features:**
- ✅ Full name, username, email, phone
- ✅ Password with confirmation
- ✅ Class selection (required)
- ✅ Course selection (optional - can register later)
- ✅ No registration code needed
- ✅ Direct link from student login page

**Access Points:**
- Main landing page (`index.html`)
- Student login page (`student-login.html`)

---

## 👨‍🏫 Lecturer Registration

**URL:**
```
http://localhost:8000/lecturer-register.html
```

**Network:**
```
http://192.168.2.113:8000/lecturer-register.html
```

**Features:**
- ✅ Full name, username, email
- ✅ Password with confirmation
- ✅ Registration code required (restricted access)
- ✅ Contact administration for code
- ✅ Direct link from lecturer login page

**Access Points:**
- Main landing page (`index.html`)
- Lecturer login page (`lecturer-login.html`)

---

## 🔗 Registration Links Location

### Main Landing Page (`index.html`):
- **Section:** "New User? Register Here"
- **Links:**
  - 🎓 Register as Student → `student-register.html`
  - 👨‍🏫 Register as Lecturer → `lecturer-register.html`

### Student Login Page (`student-login.html`):
- **Section:** Below login button
- **Link:** 🎓 Register as Student → `student-register.html`

### Lecturer Login Page (`lecturer-login.html`):
- **Section:** Below login button
- **Link:** 👨‍🏫 Register as Lecturer → `lecturer-register.html`

---

## 📋 Quick Reference

| Role | Registration Page | Access From |
|------|------------------|-------------|
| **Student** | `student-register.html` | Main page, Student login |
| **Lecturer** | `lecturer-register.html` | Main page, Lecturer login |

---

## ✅ Benefits

1. **Clear Separation:** Each role has its own registration page
2. **Easy Access:** Registration links on all relevant pages
3. **Better UX:** Users know exactly where to register
4. **Security:** Lecturer registration still requires code
5. **Mobile Friendly:** All pages optimized for mobile

---

## 🧪 Testing

1. **Student Registration:**
   - Go to `student-register.html`
   - Fill in all required fields
   - Select class
   - Submit registration
   - Should redirect to student login

2. **Lecturer Registration:**
   - Go to `lecturer-register.html`
   - Enter registration code
   - Fill in all required fields
   - Submit registration
   - Should redirect to lecturer login

---

**Last Updated:** January 2026
