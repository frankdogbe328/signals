# 🚀 How to Start Local Server - Step by Step

## ✅ Easiest Method: Double-Click Script

### **Step 1: Find the File**
- Look in your project folder: `system fot military`
- Find file: `START_LOCAL_SERVER.bat`
- It's a Windows batch file (looks like a gear icon)

### **Step 2: Double-Click It**
- Just double-click `START_LOCAL_SERVER.bat`
- A black window (Command Prompt) will open
- You'll see messages like:
  ```
  Starting Local Web Server (Network Access)
  Server will start on:
    - Your computer: http://localhost:8000
    - Other devices: http://192.168.1.XXX:8000
  ```

### **Step 3: Keep Window Open**
- **DON'T CLOSE** the black window
- Server is running as long as window is open
- To stop: Press `Ctrl + C` or close the window

### **Step 4: Access Your Site**
- **On your computer:** Open browser → `http://localhost:8000`
- **On mobile/other devices:** Use the IP address shown (e.g., `http://192.168.1.100:8000`)

---

## 🔧 Alternative Method: Command Line

### **If double-click doesn't work:**

1. **Open PowerShell or Command Prompt:**
   - Press `Windows Key + R`
   - Type: `powershell` or `cmd`
   - Press Enter

2. **Navigate to your project:**
   ```powershell
   cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"
   ```

3. **Run the command:**
   ```powershell
   python -m http.server 8000 --bind 0.0.0.0
   ```

4. **You'll see:**
   ```
   Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
   ```

5. **Keep window open** - server is running!

6. **Access site:**
   - Your computer: `http://localhost:8000`
   - Other devices: `http://YOUR_IP:8000`

---

## 📱 Finding Your IP Address

### **Method 1: From Server Window**
- The `START_LOCAL_SERVER.bat` script shows it automatically
- Look for line: `Other devices: http://192.168.1.XXX:8000`

### **Method 2: Manual Check**
1. Open PowerShell/Command Prompt
2. Type: `ipconfig`
3. Press Enter
4. Look for "IPv4 Address"
5. Example: `192.168.1.100`

---

## ✅ Quick Checklist

- [ ] Found `START_LOCAL_SERVER.bat` file
- [ ] Double-clicked it
- [ ] Black window opened
- [ ] Saw "Server will start on..." message
- [ ] Kept window open
- [ ] Opened browser → `http://localhost:8000`
- [ ] Site loaded! ✅

---

## 🎯 What You Should See

### **In the Server Window:**
```
========================================
Starting Local Web Server (Network Access)
========================================

Finding your IP address...
IPv4 Address. . . . . . . . . . . . : 192.168.1.100

Server will start on:
  - Your computer: http://localhost:8000
  - Other devices: http://192.168.1.100:8000

Share the IP address above with students
(e.g., http://192.168.1.100:8000)

Press Ctrl+C to stop the server

Serving HTTP on 0.0.0.0 port 8000 ...
```

### **In Your Browser:**
- Should see the login page
- Can register/login
- Everything works!

---

## ⚠️ Troubleshooting

### **"Python not found" Error:**
- Python might not be in PATH
- Use the double-click method instead
- Or install Python properly

### **"Port 8000 already in use":**
- Another server is running
- Close other server windows
- Or use different port: `python -m http.server 8080 --bind 0.0.0.0`

### **Can't find START_LOCAL_SERVER.bat:**
- Check you're in the right folder
- Look for `.bat` files
- Or use command line method

---

## 🎯 Summary

**Just double-click `START_LOCAL_SERVER.bat` - that's it!**

The window will show you everything you need:
- ✅ Your computer URL
- ✅ Network URL for mobile/laptops
- ✅ IP address to share

**Keep the window open while testing!**
