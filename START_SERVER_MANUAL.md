# 🚀 Manual Server Start - If Batch File Doesn't Work

## ❌ Problem: Batch File Doesn't Open

If double-clicking `START_LOCAL_SERVER.bat` doesn't show a window, try these methods:

---

## ✅ Method 1: Right-Click → Run as Administrator

1. **Right-click** on `START_LOCAL_SERVER.bat`
2. Select **"Run as administrator"**
3. Click **"Yes"** if Windows asks for permission
4. Window should open now

---

## ✅ Method 2: Open PowerShell First, Then Run

1. **Press `Windows Key + X`**
2. Select **"Windows PowerShell"** or **"Terminal"**
3. **Type this** (copy and paste):
   ```powershell
   cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"
   ```
4. Press **Enter**
5. **Type this**:
   ```powershell
   python -m http.server 8000 --bind 0.0.0.0
   ```
6. Press **Enter**
7. **Window will show server running!**

---

## ✅ Method 3: Use VS Code Terminal

1. **Open VS Code**
2. **Open your project folder**
3. Press **`` Ctrl + ` ``** (backtick key) to open terminal
4. **Type**:
   ```bash
   python -m http.server 8000 --bind 0.0.0.0
   ```
5. Press **Enter**

---

## ✅ Method 4: Simple Batch File

I created `START_SERVER_SIMPLE.bat` - try double-clicking that instead!

---

## 🔍 Troubleshooting

### **"Python not found" Error:**
- Python might not be installed
- Or not in PATH
- Try: `py -m http.server 8000 --bind 0.0.0.0` instead

### **Window Opens and Closes Immediately:**
- There's an error
- Use Method 2 (PowerShell) to see the error message
- Or check if Python is installed

### **Nothing Happens:**
- Windows might be blocking it
- Try Method 1 (Run as Administrator)
- Or use PowerShell method

---

## 🎯 Recommended: Use PowerShell Method

**This always works:**

1. **Windows Key + X** → **PowerShell**
2. **Copy and paste:**
   ```powershell
   cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"
   python -m http.server 8000 --bind 0.0.0.0
   ```
3. **Press Enter**
4. **Done!** Server is running

---

## 📱 After Server Starts

Once you see:
```
Serving HTTP on 0.0.0.0 port 8000 ...
```

**Then:**
1. Open browser
2. Go to: `http://localhost:8000`
3. Site should load!

**To find IP for mobile:**
- In PowerShell, type: `ipconfig`
- Look for "IPv4 Address"
- Use: `http://YOUR_IP:8000`

---

**Try Method 2 (PowerShell) - it's the most reliable!**
