# 📱 How to Get Shareable Portal Links from Vercel

## ❓ Problem: Links Show as Text When Shared

If you're sharing links like:
- `/lecturer-portal-links.html`
- `/student-portal-links.html`
- `/admin-portal-links.html`

These are **relative paths** - they need your Vercel base URL to become full shareable links!

---

## ✅ Solution: Use the Link Generator Tool

I've created a tool that makes this super easy!

### **Step 1: Deploy to Vercel**

1. If you haven't deployed yet:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Get your Vercel URL** from the deployment output:
   - Example: `https://signals-lms.vercel.app`
   - Or check your Vercel dashboard

### **Step 2: Use the Link Generator**

1. **Open the tool:**
   - Local: `GET_SHAREABLE_LINKS.html`
   - Or after deploying: `https://your-project.vercel.app/GET_SHAREABLE_LINKS.html`

2. **Enter your Vercel URL:**
   - Example: `https://signals-lms.vercel.app`
   - The tool will auto-detect it if you open it from Vercel

3. **Click "Generate Shareable Links"**

4. **Copy the full links:**
   - Lecturer Link
   - Student Link
   - Admin Link

### **Step 3: Share the Links**

Now you have **full shareable URLs** like:
```
https://signals-lms.vercel.app/lecturer-portal-links.html
https://signals-lms.vercel.app/student-portal-links.html
https://signals-lms.vercel.app/admin-portal-links.html
```

These work perfectly when shared via:
- ✅ WhatsApp
- ✅ Email
- ✅ SMS
- ✅ Any messaging app
- ✅ Social media

---

## 📋 Quick Method: Manual URL Building

If you prefer to build them manually:

### **Your Vercel URL Format:**
```
https://your-project-name.vercel.app
```

### **Full Shareable Links:**

**For Lecturers:**
```
https://your-project-name.vercel.app/lecturer-portal-links.html
```

**For Students:**
```
https://your-project-name.vercel.app/student-portal-links.html
```

**For Admin:**
```
https://your-project-name.vercel.app/admin-portal-links.html
```

---

## 🎯 Example with Real Vercel URL

If your Vercel project is `signals-lms`, your full URLs would be:

### **Lecturer Portal:**
```
https://signals-lms.vercel.app/lecturer-portal-links.html
```

### **Student Portal:**
```
https://signals-lms.vercel.app/student-portal-links.html
```

### **Admin Portal:**
```
https://signals-lms.vercel.app/admin-portal-links.html
```

---

## 📱 How to Find Your Vercel URL

### **Method 1: From Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Login to your account
3. Click on your project
4. Look at the top - you'll see your deployment URL
5. Example: `signals-lms.vercel.app`

### **Method 2: From Deployment Output**
After running `vercel deploy`, you'll see:
```
✅ Production: https://signals-lms.vercel.app
```

### **Method 3: From Git Integration**
If you connected GitHub:
1. Every push auto-deploys
2. Check your Vercel dashboard for the URL
3. URL format: `your-project-name.vercel.app`

---

## 💡 Pro Tips

### **Tip 1: Bookmark the Generator**
Bookmark `GET_SHAREABLE_LINKS.html` for easy access to generate links anytime.

### **Tip 2: Save Your Vercel URL**
Save your Vercel URL somewhere easy to find:
- Notes app
- Clipboard
- Bookmark

### **Tip 3: Test the Links**
Before sharing:
1. Open the link in your browser
2. Make sure it loads correctly
3. Test on mobile too!

---

## 📝 Template Messages for Sharing

### **For Lecturers:**
```
Hello Lecturer,

Access all your portals here:
https://signals-lms.vercel.app/lecturer-portal-links.html

This works perfectly on mobile phones too!
Bookmark it for easy access.
```

### **For Students:**
```
Dear Students,

Access your portals here:
https://signals-lms.vercel.app/student-portal-links.html

You can:
• Login/Register
• Access Learning Materials
• Take Exams

Bookmark this link on your phone!
```

### **For Admin:**
```
[SECURE CHANNEL]

Admin Portal Access:
https://signals-lms.vercel.app/admin-portal-links.html

Keep this link confidential.
Works on all devices.
```

---

## ⚠️ Common Mistakes to Avoid

❌ **Don't share:**
- `/lecturer-portal-links.html` (missing base URL)
- `lecturer-portal-links.html` (relative path)
- `localhost:5500/...` (won't work for others)

✅ **Do share:**
- `https://your-project.vercel.app/lecturer-portal-links.html` (full URL)
- Use the generator tool for accuracy

---

## 🚀 Quick Checklist

- [ ] Deployed to Vercel
- [ ] Got your Vercel URL
- [ ] Used `GET_SHAREABLE_LINKS.html` to generate full URLs
- [ ] Tested the links in browser
- [ ] Shared appropriate link with each role
- [ ] Confirmed links work on mobile

---

**Need Help?** Just open `GET_SHAREABLE_LINKS.html` and enter your Vercel URL - it does everything for you!
