# 🖥️ Local Access Instructions

## ⚠️ Important: "Site Can't Be Reached" Error

If you're seeing "this site can't be reached" errors, it means you're trying to access the files directly from your file system (using `file://` protocol). This won't work for web applications.

## ✅ Solution: Use a Local Web Server

You need to run a local web server to access the portals. Here are three easy options:

---

## Option 1: VS Code Live Server (Recommended)

### Setup:
1. Install VS Code if you don't have it
2. Install the "Live Server" extension in VS Code
3. Open your project folder in VS Code
4. Right-click on `index.html` or `PORTAL_LINKS.html`
5. Select "Open with Live Server"

### Access URLs:
- Main Login: `http://localhost:5500/index.html`
- Portal Links: `http://localhost:5500/PORTAL_LINKS.html`
- Admin Login: `http://localhost:5500/admin-login.html`
- etc.

---

## Option 2: Python HTTP Server

### Setup:
1. Open Terminal/Command Prompt in your project folder
2. Run one of these commands:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

### Access URLs:
- Main Login: `http://localhost:8000/index.html`
- Portal Links: `http://localhost:8000/PORTAL_LINKS.html`
- Admin Login: `http://localhost:8000/admin-login.html`
- etc.

---

## Option 3: Node.js HTTP Server

### Setup:
1. Install Node.js if you don't have it
2. Install `http-server` globally:
```bash
npm install -g http-server
```

3. Navigate to your project folder and run:
```bash
http-server -p 8000
```

### Access URLs:
- Main Login: `http://localhost:8000/index.html`
- Portal Links: `http://localhost:8000/PORTAL_LINKS.html`
- Admin Login: `http://localhost:8000/admin-login.html`
- etc.

---

## 🚀 For Production: Deploy to Vercel

### Quick Deploy Steps:

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Confirm project settings
   - Deploy!

5. **Get your URL:**
   - Vercel will give you a URL like: `https://your-project.vercel.app`
   - All portal links will work automatically!

---

## 📋 All Portal Links (After Setting Up Server)

Once you have a local server running or deployed to Vercel:

### Admin Portals
- Admin Login: `/admin-login.html`
- Admin Dashboard: `/admin-portal.html`

### Lecturer Portals
- Lecturer Login: `/lecturer-login.html`
- Lecturer Registration: `/lecturer-register.html`
- Lecturer LMS: `/lecturer-dashboard.html`
- Lecturer Exam: `/exam-portal/lecturer-exam-dashboard.html`

### Student Portals
- Student Login: `/index.html` (or `/`)
- Student LMS: `/student-dashboard.html`
- Student Exam: `/exam-portal/student-exam-portal.html`

### Quick Access
- All Links: `/PORTAL_LINKS.html`

---

## 🔍 Troubleshooting

### "Site Can't Be Reached" Error:
- ✅ Use a local web server (see options above)
- ✅ Don't double-click HTML files to open them
- ✅ Use `http://localhost:PORT` URLs

### Links Not Working:
- ✅ Make sure you're using a web server (not `file://`)
- ✅ Check that all files are in the correct folders
- ✅ Verify the port number matches your server

### Port Already in Use:
- ✅ Try a different port (e.g., 8001, 8080, 3000)
- ✅ Close other applications using that port

---

## 💡 Quick Test

1. Start a local server (any option above)
2. Open: `http://localhost:PORT/PORTAL_LINKS.html`
3. All links should work!

---

**Need Help?** Make sure you're using a web server, not opening files directly from your file system!
