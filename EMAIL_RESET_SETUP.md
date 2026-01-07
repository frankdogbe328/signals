# Email Password Reset Setup

## How It Works

When a user requests password reset via email:
1. User enters their email and role
2. System generates a **6-digit PIN code**
3. PIN is sent to their email address
4. User enters PIN to verify
5. User can then set new password

## Setup Options

### Option 1: EmailJS (Recommended - Free & Easy)

EmailJS is a free email service that doesn't require a backend server.

#### Steps:
1. Go to https://www.emailjs.com/
2. Sign up for free account
3. Create an email service (Gmail, Outlook, etc.)
4. Get your:
   - **Public Key** (User ID)
   - **Service ID**
   - **Template ID**
5. Add these to `js/email-config.js` (we'll create this)

#### Free Tier Limits:
- 200 emails/month (free)
- Perfect for testing and small deployments

### Option 2: Supabase Email (If Available)

If you have Supabase email configured:
- Use Supabase's built-in email service
- More secure and integrated

### Option 3: Custom Email Server

If you have your own email server:
- Configure SMTP settings
- Use Node.js backend to send emails

## Current Implementation

Right now, the system:
- ✅ Generates reset PIN
- ✅ Stores PIN temporarily
- ⚠️ Shows PIN on screen (for demo)
- ❌ Doesn't send email yet

## Next Steps

1. Choose an email service (EmailJS recommended)
2. Get API keys
3. Configure email sending
4. Test email delivery

---

## EmailJS Quick Setup Guide

### 1. Create EmailJS Account
- Visit: https://www.emailjs.com/
- Sign up (free)

### 2. Add Email Service
- Dashboard → Email Services
- Click "Add New Service"
- Choose your email provider (Gmail recommended)
- Follow setup instructions

### 3. Create Email Template
- Dashboard → Email Templates
- Create new template
- Use this template:

```
Subject: Password Reset - Signal Training School LMS

Hello,

You requested a password reset for your account.

Your reset PIN is: {{pin}}

Enter this PIN on the password reset page to continue.

This PIN expires in 1 hour.

If you didn't request this, please ignore this email.

---
Signal Training School LMS
```

### 4. Get Your Keys
- Public Key (User ID): Found in Account → General
- Service ID: From your email service
- Template ID: From your email template

### 5. Add to System
- We'll add these to `js/email-config.js`
- System will automatically send emails

---

## Security Notes

- PINs expire after 1 hour
- PINs are 6 digits (random)
- Each PIN can only be used once
- PINs are stored temporarily in database/localStorage

