# How Email Works for Password Reset

## Understanding EmailJS

**The LMS doesn't need its own email account!**

EmailJS is a service that uses **YOUR existing email account** to send emails.

## How It Works:

```
Your Email Account (Gmail/Outlook) 
    ↓
EmailJS Service (connects to your email)
    ↓
Sends emails on behalf of your account
    ↓
Users receive PIN in their inbox
```

## What You Need:

### **Just ONE email account** (any of these):

1. **Your Personal Gmail** ✅
   - You already have this
   - EmailJS connects to it
   - Uses it to send reset PINs
   - **Safe to use** - EmailJS only sends emails, doesn't access your inbox

2. **School Email** ✅
   - If you have access to school email
   - More professional
   - Better for production

3. **Dedicated Gmail** ✅
   - Create new Gmail just for this
   - Separate from personal
   - Good for production

## Important Points:

### ✅ **What EmailJS Does:**
- Connects to your email account
- Sends emails using your account
- Users see emails FROM your email address
- **Does NOT access your inbox**
- **Does NOT read your emails**

### ✅ **What Users See:**
- Email FROM: `your-email@gmail.com` (or whatever you use)
- Subject: "Password Reset - Signal Training School LMS"
- Content: Their 6-digit PIN

### ✅ **Security:**
- EmailJS only has permission to SEND emails
- Cannot read your emails
- Cannot access your account
- You can revoke access anytime

## Setup Process:

1. **Go to EmailJS.com**
2. **Sign up** (free account)
3. **Add Email Service** → Choose Gmail
4. **Login with YOUR email** (personal Gmail is fine)
5. **Authorize EmailJS** (gives permission to send emails only)
6. **Done!** Now the system can send emails

## Example:

**If you use your personal Gmail:**
- Your email: `frank.dogbe@gmail.com`
- EmailJS connects to it
- Users receive emails FROM: `frank.dogbe@gmail.com`
- EmailJS sends the PIN emails
- **Your inbox is NOT affected**

## Recommendation:

### **For Testing:**
- ✅ Use your **personal Gmail** - it's fine!
- Quick to set up
- Good for testing
- Safe (EmailJS only sends, doesn't read)

### **For Production:**
- ✅ Create **dedicated Gmail** (optional)
- Or use **school email** (if available)
- Or continue with personal (it's fine!)

## Bottom Line:

**You don't need a special "LMS email account"!**

Just use:
- Your personal Gmail ✅
- Or any email you have access to ✅

EmailJS will use it to send password reset PINs to users.

**Your personal email is perfectly fine to use!** 🎯

