# 🔍 System Status Check Guide

## ✅ How to Check if System is Active

### 1. **Check Local Server Status**

#### Windows:
```powershell
# Check if Python server is running on port 8000
netstat -ano | findstr :8000

# Or check all Python processes
tasklist | findstr python
```

#### If Server is NOT Running:
- Double-click `START_LOCAL_SERVER.bat`
- Or run: `python -m http.server 8000 --bind 0.0.0.0`

---

### 2. **Test System Access**

#### Local Access:
- Open browser: `http://localhost:8000`
- Should see main landing page

#### Network Access:
- Find your IP: `ipconfig` (look for IPv4 Address)
- Access from other devices: `http://YOUR_IP:8000`

---

### 3. **Quick System Health Check**

#### ✅ Login Pages:
- [ ] `http://localhost:8000/index.html` - Main landing page loads
- [ ] `http://localhost:8000/student-login.html` - Student login loads
- [ ] `http://localhost:8000/lecturer-login.html` - Lecturer login loads
- [ ] `http://localhost:8000/admin-login.html` - Admin login loads

#### ✅ Student Portals:
- [ ] `http://localhost:8000/student-dashboard.html` - LMS portal loads (after login)
- [ ] `http://localhost:8000/exam-portal/student-exam-portal.html` - Exam portal loads (after login)

#### ✅ Lecturer Portals:
- [ ] `http://localhost:8000/lecturer-dashboard.html` - LMS portal loads (after login)
- [ ] `http://localhost:8000/exam-portal/lecturer-exam-dashboard.html` - Exam portal loads (after login)

#### ✅ Admin Portal:
- [ ] `http://localhost:8000/admin-portal.html` - Admin portal loads (after login)

---

### 4. **Check Database Connection**

#### Supabase Connection:
- Open browser console (F12)
- Check for Supabase connection errors
- Should see: "Supabase client initialized" or similar

#### Common Issues:
- ❌ "Supabase client not available" → Check `js/supabase-config.js`
- ❌ Network errors → Check internet connection
- ❌ CORS errors → Check Supabase settings

---

### 5. **System Components Status**

#### ✅ JavaScript Files Loading:
- Check browser console (F12)
- No red errors = System active
- Yellow warnings = Usually OK, check if functionality works

#### ✅ CSS Styling:
- Pages should look styled (not plain HTML)
- Mobile responsive design should work
- Forms should be properly formatted

#### ✅ Authentication:
- Can login as student
- Can login as lecturer
- Can login as admin
- Logout works correctly

---

### 6. **Quick Restart Guide**

#### If System is Not Responding:

1. **Stop Server:**
   - Close command prompt window running server
   - Or press `Ctrl + C` in server window

2. **Restart Server:**
   - Double-click `START_LOCAL_SERVER.bat`
   - Or run: `python -m http.server 8000 --bind 0.0.0.0`

3. **Clear Browser Cache:**
   - Press `Ctrl + Shift + R` (hard refresh)
   - Or clear browser cache

4. **Check Port Availability:**
   - If port 8000 is busy, use different port:
   - `python -m http.server 8080 --bind 0.0.0.0`
   - Then access: `http://localhost:8080`

---

### 7. **Production Status (Vercel)**

#### Check Vercel Deployment:
- Visit your Vercel dashboard
- Check deployment status
- Latest commit should be deployed

#### Common Vercel Issues:
- ❌ "Try again after X hours" → Deployment limit reached
- ❌ Build failed → Check build logs
- ❌ 404 errors → Check file paths

---

## 🚨 Troubleshooting

### System Not Loading?
1. ✅ Check server is running
2. ✅ Check port is correct (8000)
3. ✅ Check browser console for errors
4. ✅ Try different browser
5. ✅ Check firewall settings

### Login Not Working?
1. ✅ Check Supabase connection
2. ✅ Verify credentials in database
3. ✅ Check browser console for errors
4. ✅ Try clearing browser cache

### Mobile Not Working?
1. ✅ Check network IP address
2. ✅ Ensure server bound to `0.0.0.0`
3. ✅ Check firewall allows connections
4. ✅ Verify devices on same WiFi network

---

## ✅ System Active Checklist

- [ ] Local server running on port 8000
- [ ] Can access `http://localhost:8000`
- [ ] Login pages load correctly
- [ ] Can login successfully
- [ ] Portals load after login
- [ ] No console errors
- [ ] Mobile access works (if needed)

---

**Last Updated:** January 2026
