# EmailJS Setup - Step by Step Guide

## Where to Paste the Email Template

The template you have is the **EMAIL BODY CONTENT** - it goes in the **Email Template** section, NOT in "to" or "from" fields.

## Complete Setup Steps:

### **Step 1: Create EmailJS Account**
1. Go to https://www.emailjs.com/
2. Click "Sign Up" (free)
3. Create account with your email

### **Step 2: Add Email Service (Gmail)**
1. In EmailJS Dashboard, click **"Email Services"** (left sidebar)
2. Click **"Add New Service"**
3. Choose **"Gmail"**
4. Click **"Connect Account"**
5. Login with **YOUR Gmail** (the one you want to use)
6. Authorize EmailJS
7. **Save** - You'll get a **Service ID** (like `service_xxxxx`)

### **Step 3: Create Email Template**
1. In EmailJS Dashboard, click **"Email Templates"** (left sidebar)
2. Click **"Create New Template"**
3. Fill in the form:

#### **Template Name:**
```
Password Reset
```

#### **Subject:**
```
Password Reset - Signal Training School LMS
```

#### **Content (Email Body):**
**THIS IS WHERE YOU PASTE YOUR TEMPLATE:**

```
Hello {{to_name}},

You requested a password reset for your Signal Training School LMS account.

Your reset PIN is: {{pin}}

Enter this 6-digit PIN on the password reset page to continue.

This PIN expires in 1 hour.

If you didn't request this reset, please ignore this email.

---
Signal Training School
Learning Management System
```

#### **Important Variables:**
- `{{to_name}}` - Will be replaced with user's name
- `{{pin}}` - Will be replaced with 6-digit PIN
- `{{to_email}}` - Will be replaced with user's email

4. **Save Template** - You'll get a **Template ID** (like `template_xxxxx`)

### **Step 4: Get Your Public Key**
1. In EmailJS Dashboard, click **"Account"** (top right)
2. Click **"General"**
3. Find **"Public Key"** (also called User ID)
4. Copy it (looks like: `xxxxxxxxxxxxx`)

### **Step 5: Add Keys to Your System**
1. Open `js/email-config.js` in your project
2. Replace the placeholder values:

```javascript
window.EMAILJS_CONFIG = {
    // Your Public Key from Account → General
    PUBLIC_KEY: 'paste_your_public_key_here',
    
    // Your Service ID from Email Services
    SERVICE_ID: 'paste_your_service_id_here',
    
    // Your Template ID from Email Templates
    TEMPLATE_ID: 'paste_your_template_id_here'
};
```

3. Save the file

### **Step 6: Test It!**
1. Open your LMS login page
2. Click "Forgot Password?"
3. Choose "Reset via Email"
4. Enter an email address
5. Click "Send Reset Link"
6. Check the email inbox - you should receive the PIN!

## Visual Guide:

```
EmailJS Dashboard
├── Email Services
│   └── Gmail Service
│       └── Service ID: service_xxxxx  ← COPY THIS
│
├── Email Templates
│   └── Password Reset Template
│       ├── Subject: Password Reset - Signal Training School LMS
│       ├── Content: [PASTE YOUR TEMPLATE HERE] ← HERE!
│       └── Template ID: template_xxxxx  ← COPY THIS
│
└── Account → General
    └── Public Key: xxxxxxxxxxxxx  ← COPY THIS
```

## Summary:

- **"To Email"** = User's email (automatically filled by system)
- **"From Email"** = Your Gmail (set when you connect Gmail service)
- **Template Content** = Where you paste the email body text ← **THIS IS WHERE IT GOES!**

## The Template Goes In:

**Email Templates → Create New Template → Content Field**

That's where you paste your email template! 📧

