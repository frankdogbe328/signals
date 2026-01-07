# Email Setup Recommendations for Password Reset

## Should You Use Your Personal Email?

### ❌ **Not Recommended:**
- **Personal Gmail** - Not ideal for institutional use
- **Personal Outlook** - May look unprofessional
- **Personal Yahoo** - Not suitable for official communications

### ✅ **Recommended Options:**

#### **Option 1: School/Institutional Email (BEST)**
- Use the **Signal Training School's official email**
- Example: `lms@signal-training-school.mil.gh` or `noreply@signal-training-school.mil.gh`
- **Pros:**
  - Professional and official
  - Users trust it more
  - Matches your institution
- **Cons:**
  - May need IT department approval
  - May need to configure SMTP settings

#### **Option 2: Create Dedicated Email Account (GOOD)**
- Create a new Gmail account specifically for the LMS
- Example: `signal-training-lms@gmail.com` or `gh-signal-lms@gmail.com`
- **Pros:**
  - Separate from personal email
  - Easy to set up
  - Free
  - Can be shared with team
- **Cons:**
  - Still uses Gmail domain (less official looking)

#### **Option 3: Use Your Personal Email (OK for Testing)**
- Use your personal email temporarily
- **Pros:**
  - Quick to set up
  - Good for testing
- **Cons:**
  - Not professional
  - Personal email exposed
  - Not suitable for production

## Recommended Setup Steps:

### **For Production (Best Practice):**

1. **Get School Email Account:**
   - Contact IT department
   - Request: `lms@signal-training-school.mil.gh` or similar
   - Get SMTP credentials

2. **Or Create Dedicated Gmail:**
   - Create: `signal-training-lms@gmail.com`
   - Use this for all system emails
   - Share login with authorized staff

3. **Configure EmailJS:**
   - Connect the chosen email
   - Test sending
   - Verify emails arrive

### **For Testing (Quick Start):**

1. **Use Personal Email Temporarily:**
   - Connect your personal Gmail
   - Test the system
   - Switch to official email later

2. **Test Email Sending:**
   - Request password reset
   - Check if PIN arrives
   - Verify it works

## EmailJS Setup with Gmail:

### **Steps:**

1. **Go to EmailJS Dashboard:**
   - https://www.emailjs.com/
   - Login or sign up

2. **Add Email Service:**
   - Click "Add New Service"
   - Choose "Gmail"
   - Click "Connect Account"
   - **Login with the email you want to use**
   - Authorize EmailJS

3. **Create Email Template:**
   - Go to "Email Templates"
   - Create new template
   - Use this template:

```
Subject: Password Reset - Signal Training School LMS

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

4. **Get Your Keys:**
   - **Public Key:** Account → General → Public Key
   - **Service ID:** From your Gmail service
   - **Template ID:** From your email template

5. **Add to System:**
   - Open `js/email-config.js`
   - Replace the placeholder values with your keys

## Security Considerations:

- ✅ Email service is separate from your personal email
- ✅ EmailJS only sends emails, doesn't access your inbox
- ✅ You can revoke access anytime
- ✅ Free tier: 200 emails/month (enough for testing)

## Recommendation:

**For Now (Testing):**
- Use a dedicated Gmail account (create new one)
- Example: `signal-training-lms@gmail.com`
- Test the system
- Verify emails work

**For Production:**
- Get official school email account
- Or continue with dedicated Gmail
- Update EmailJS configuration
- Test thoroughly before going live

## Quick Decision Guide:

- ✅ **Testing/Development:** Create dedicated Gmail account
- ✅ **Production:** Use school official email (if available)
- ⚠️ **Temporary:** Personal email OK for quick testing only
- ❌ **Long-term:** Don't use personal email for production

---

**My Recommendation:** Create a dedicated Gmail account like `signal-training-lms@gmail.com` - it's professional enough, easy to set up, and separate from your personal email.

