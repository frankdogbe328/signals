# 🔐 Lecturer Registration Code System - How It Works

## 📋 Overview

The lecturer registration system uses a **registration code** to restrict access. Only people with the correct code can register as lecturers. This prevents unauthorized users from creating lecturer accounts.

---

## 🔍 How It Works

### **Current Setup:**

1. **Registration Code Location:**
   - File: `js/lecturer-register.js`
   - Variable: `LECTURER_REGISTRATION_CODE`
   - Current Default: `'LECTURER2026'`

2. **How It Validates:**

```
Step 1: User visits /lecturer-register.html
Step 2: User fills in registration form
Step 3: User enters the registration code
Step 4: System checks if code matches LECTURER_REGISTRATION_CODE
Step 5: If match → Registration proceeds
Step 6: If no match → Error: "Invalid registration code"
```

---

## 📝 Step-by-Step Process

### **For Lecturers (Users):**

1. **Go to Registration Page:**
   - Visit: `/lecturer-register.html`
   - Or click "New Lecturer? Register Here" on lecturer login page

2. **Fill in Form:**
   - Enter Full Name
   - Choose Username
   - Enter Email
   - Create Password
   - Confirm Password

3. **Enter Registration Code:**
   - Enter the code you received from administration
   - Example: `LECTURER2026`
   - Code is case-insensitive (LECTURER2026 = lecturer2026)

4. **Submit:**
   - Click "Register as Lecturer"
   - If code is correct → Account created
   - If code is wrong → Error message shown

---

## ⚙️ Technical Details

### **Code Validation (JavaScript):**

```javascript
// In js/lecturer-register.js

// 1. Get code from input field
const registrationCode = document.getElementById('registrationCode')
    .value.trim()
    .toUpperCase(); // Converts to uppercase

// 2. Compare with stored code
if (registrationCode !== LECTURER_REGISTRATION_CODE) {
    // Show error
    errorMessage.textContent = 'Invalid registration code...';
    return; // Stop registration
}

// 3. If code matches, continue with registration
// Create lecturer account in database...
```

### **Features:**
- ✅ **Case-Insensitive:** `LECTURER2026` = `lecturer2026` = `Lecturer2026`
- ✅ **Trimmed:** Spaces before/after are removed
- ✅ **Required:** Code must be entered to register
- ✅ **Client-Side Validation:** Checks before submitting to database

---

## 🔧 How to Change the Registration Code

### **Step 1: Open the File**
- File: `js/lecturer-register.js`
- Line: 5

### **Step 2: Change the Code**
```javascript
// OLD:
const LECTURER_REGISTRATION_CODE = 'LECTURER2026';

// NEW (example):
const LECTURER_REGISTRATION_CODE = 'SIGNALS2027';
```

### **Step 3: Save and Deploy**
- Save the file
- Commit to Git
- Deploy to Vercel (if using)
- **Important:** Tell all authorized lecturers the new code!

---

## 💡 Best Practices

### **1. Use a Strong Code:**
❌ **Weak Codes:**
- `1234`
- `lecturer`
- `password`

✅ **Strong Codes:**
- `SIGNALS2027`
- `GAFAST-LECT-2027`
- `LECT@2027#CODE`

### **2. Change Regularly:**
- Change code every semester/term
- Or when there's a security concern
- Keep previous codes for existing registrations

### **3. Share Securely:**
- Send code via email or secure messaging
- Don't post in public places
- Only share with authorized personnel

### **4. Document Changes:**
- Keep track of code changes
- Note when code was changed
- Maintain list of who has access

---

## 📱 Where the Code is Used

### **1. Registration Page:**
- File: `lecturer-register.html`
- Shows input field for registration code
- Displays message: "Contact administration for the registration code"

### **2. Validation Script:**
- File: `js/lecturer-register.js`
- Line 34-41: Gets and validates the code
- Line 37: Compares entered code with stored code

### **3. Documentation:**
- Mentioned in: `ALL_PORTAL_LINKS.md`
- Mentioned in: `PORTAL_LINKS_GUIDE.md`
- Mentioned in: `SHARE_PORTAL_LINKS.md`

---

## 🔒 Security Features

### **What Protects You:**
1. ✅ **Hidden Registration Page:**
   - Lecturer registration link not visible to students
   - Only accessible via direct URL or lecturer login page

2. ✅ **Code Required:**
   - Can't register without correct code
   - Error message doesn't reveal what the code should be

3. ✅ **Case-Insensitive:**
   - Reduces user errors
   - More user-friendly

4. ✅ **Form Validation:**
   - Checks code before submitting to database
   - Saves server resources

---

## ⚠️ Important Notes

### **Current Default Code:**
```
LECTURER2026
```

### **⚠️ CHANGE THIS IN PRODUCTION!**
The default code is for testing. Change it before going live!

### **How to Share Code with Lecturers:**

**Option 1: Email**
```
Subject: Lecturer Registration Code

Dear Lecturer,

To register for the Signal Training School LMS, please use:
Registration Code: LECTURER2026

Registration Link: https://your-project.vercel.app/lecturer-register.html

Best regards,
Administration
```

**Option 2: WhatsApp/Message**
```
Lecturer Registration:
Code: LECTURER2026
Link: [registration link]
```

---

## 🚨 Troubleshooting

### **Problem: "Invalid registration code" Error**

**Possible Causes:**
1. ❌ Code entered incorrectly
2. ❌ Extra spaces before/after code
3. ❌ Code hasn't been updated in `js/lecturer-register.js`
4. ❌ Browser cache showing old version

**Solutions:**
1. ✅ Double-check the code
2. ✅ Make sure code matches exactly (case doesn't matter)
3. ✅ Clear browser cache (Ctrl+Shift+R)
4. ✅ Verify code in `js/lecturer-register.js`

### **Problem: Code Not Working After Update**

**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+F5)
3. Check file was saved correctly
4. Redeploy if using Vercel

---

## 📊 Code Location Summary

| Item | Location |
|------|----------|
| **Code Variable** | `js/lecturer-register.js` (line 5) |
| **Registration Form** | `lecturer-register.html` |
| **Validation Logic** | `js/lecturer-register.js` (lines 34-41) |
| **Error Messages** | `js/lecturer-register.js` (line 38) |

---

## 🎯 Quick Reference

### **To Change Code:**
1. Edit `js/lecturer-register.js`
2. Change line 5: `const LECTURER_REGISTRATION_CODE = 'YOUR_NEW_CODE';`
3. Save and deploy

### **Current Code:**
```
LECTURER2026
```

### **Registration Page:**
```
/lecturer-register.html
```

### **Code Features:**
- Case-insensitive
- Spaces trimmed
- Required for registration
- Validated before account creation

---

## 💬 Example Workflow

**Scenario: New Lecturer Needs to Register**

1. **Admin gives lecturer the code:** `SIGNALS2027`
2. **Lecturer visits:** `https://your-project.vercel.app/lecturer-register.html`
3. **Lecturer enters:**
   - Name: "Capt. John Doe"
   - Username: "jdoe"
   - Email: "jdoe@example.com"
   - Password: "SecurePass123"
   - **Registration Code: `SIGNALS2027`**
4. **System validates code:** ✅ Match found
5. **Account created:** Lecturer can now login

---

**Last Updated:** January 2026

**Remember:** Change the default code (`LECTURER2026`) before production deployment!
