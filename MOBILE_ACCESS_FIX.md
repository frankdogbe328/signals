# 📱 Mobile Access Fix Guide

## 🔍 Problem: Links Not Accessible on Phones

### Common Causes:
1. Server not bound to `0.0.0.0` (only listening on localhost)
2. Firewall blocking connections
3. Wrong IP address
4. Devices not on same WiFi network
5. Server not running

---

## ✅ Solution 1: Check Server Configuration

### Verify Server is Bound to Network:

The server MUST be started with `--bind 0.0.0.0` to allow network access.

**Current `START_LOCAL_SERVER.bat` should have:**
```batch
python -m http.server 8000 --bind 0.0.0.0
```

**NOT:**
```batch
python -m http.server 8000  ❌ (only localhost)
```

---

## ✅ Solution 2: Find Your IP Address

### Windows:
1. Open Command Prompt
2. Run: `ipconfig`
3. Look for **"IPv4 Address"** under your WiFi adapter
4. Example: `192.168.1.100`

### Share This IP:
- **Your Computer IP:** `192.168.1.100` (example - use YOUR actual IP)
- **Port:** `8000`
- **Full URL:** `http://192.168.1.100:8000`

---

## ✅ Solution 3: Restart Server Correctly

### Option A: Use Batch File (Recommended)
1. Close any existing server windows
2. Double-click `START_LOCAL_SERVER.bat`
3. Should see: `Serving HTTP on 0.0.0.0 port 8000`

### Option B: Manual Command
```powershell
cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"
python -m http.server 8000 --bind 0.0.0.0
```

---

## ✅ Solution 4: Check Firewall

### Windows Firewall:
1. Open **Windows Defender Firewall**
2. Click **"Allow an app or feature through Windows Firewall"**
3. Find **Python** or **Python.exe**
4. Check **Private** and **Public** boxes
5. Click **OK**

### Or Temporarily Disable Firewall (for testing):
1. Open **Windows Security**
2. Go to **Firewall & network protection**
3. Turn off firewall temporarily
4. Test mobile access
5. Turn firewall back on after testing

---

## ✅ Solution 5: Verify Network Connection

### Check:
- [ ] Phone and computer on **same WiFi network**
- [ ] WiFi name matches on both devices
- [ ] No guest network isolation
- [ ] Router allows device-to-device communication

---

## 📱 Mobile Access URLs

### Once You Have Your IP (e.g., 192.168.1.100):

**Main Pages:**
- Main Landing: `http://192.168.1.100:8000/index.html`
- Student Login: `http://192.168.1.100:8000/student-login.html`
- Lecturer Login: `http://192.168.1.100:8000/lecturer-login.html`
- Admin Login: `http://192.168.1.100:8000/admin-login.html`

**Student Portals:**
- Student LMS: `http://192.168.1.100:8000/student-dashboard.html`
- Student Exam: `http://192.168.1.100:8000/exam-portal/student-exam-portal.html`

**Lecturer Portals:**
- Lecturer LMS: `http://192.168.1.100:8000/lecturer-dashboard.html`
- Lecturer Exam: `http://192.168.1.100:8000/exam-portal/lecturer-exam-dashboard.html`

**Admin Portal:**
- Admin Portal: `http://192.168.1.100:8000/admin-portal.html`

---

## 🔧 Quick Fix Steps

1. **Stop all servers:**
   - Close all command prompt windows
   - Or press `Ctrl + C` in each server window

2. **Get your IP:**
   ```powershell
   ipconfig
   ```
   - Copy your IPv4 Address (e.g., 192.168.1.100)

3. **Start server correctly:**
   - Double-click `START_LOCAL_SERVER.bat`
   - Verify it says: `Serving HTTP on 0.0.0.0 port 8000`

4. **Test on computer first:**
   - Open: `http://YOUR_IP:8000` (replace YOUR_IP)
   - Should work on computer

5. **Test on phone:**
   - Connect phone to same WiFi
   - Open browser on phone
   - Type: `http://YOUR_IP:8000`
   - Should load!

---

## 🚨 Troubleshooting

### Still Not Working?

1. **Check server output:**
   - Should show: `Serving HTTP on 0.0.0.0 port 8000`
   - If shows `localhost` or `127.0.0.1` → Server not bound correctly

2. **Try different port:**
   ```batch
   python -m http.server 8080 --bind 0.0.0.0
   ```
   - Then use: `http://YOUR_IP:8080`

3. **Check router settings:**
   - Some routers block device-to-device communication
   - Check "AP Isolation" or "Client Isolation" settings
   - Disable if enabled

4. **Use hotspot:**
   - Create WiFi hotspot on computer
   - Connect phone to hotspot
   - Use computer's hotspot IP

---

## ✅ Verification Checklist

- [ ] Server running with `--bind 0.0.0.0`
- [ ] Server shows "Serving HTTP on 0.0.0.0 port 8000"
- [ ] Know your computer's IP address
- [ ] Phone and computer on same WiFi
- [ ] Firewall allows Python/HTTP connections
- [ ] Can access `http://YOUR_IP:8000` on computer
- [ ] Can access `http://YOUR_IP:8000` on phone

---

**Last Updated:** January 2026
