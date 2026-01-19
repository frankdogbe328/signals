# Local Hosting Requirements & Setup Guide

## 📋 Requirements

### Minimum Requirements:
1. **Web Server** (choose one):
   - **Python 3** (built-in server) - Easiest
   - **Node.js** (http-server) - Simple
   - **PHP** (built-in server) - If you have PHP
   - **XAMPP/WAMP** (Windows) - Full stack
   - **MAMP** (Mac) - Full stack
   - **Live Server** (VS Code extension) - Easiest for development

2. **Modern Web Browser**:
   - Chrome, Firefox, Edge, Safari (latest versions)
   - JavaScript enabled

3. **Internet Connection**:
   - Required for Supabase database connection
   - Required for CDN resources (Supabase JS library)

### Optional (for full functionality):
- **Git** (to clone/update repository)
- **VS Code** (recommended editor)

---

## 🚀 Quick Setup Methods

### Method 1: Python (Easiest - Works on Windows/Mac/Linux)

**Requirements:** Python 3 installed

```bash
# Navigate to project folder
cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"

# Start server (Python 3)
python -m http.server 8000

# Or Python 2 (if Python 3 not available)
python -m SimpleHTTPServer 8000
```

**Access:** Open browser → `http://localhost:8000`

**Stop:** Press `Ctrl + C` in terminal

---

### Method 2: Node.js http-server (Simple)

**Requirements:** Node.js installed

```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to project folder
cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"

# Start server
http-server -p 8000

# Or with CORS enabled (if needed)
http-server -p 8000 --cors
```

**Access:** Open browser → `http://localhost:8000`

**Stop:** Press `Ctrl + C` in terminal

---

### Method 3: PHP Built-in Server

**Requirements:** PHP installed

```bash
# Navigate to project folder
cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"

# Start server
php -S localhost:8000
```

**Access:** Open browser → `http://localhost:8000`

**Stop:** Press `Ctrl + C` in terminal

---

### Method 4: VS Code Live Server (Recommended for Development)

**Requirements:** VS Code installed

1. **Install Extension:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search "Live Server"
   - Install by Ritwick Dey

2. **Start Server:**
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Browser opens automatically

**Access:** Automatically opens in browser (usually `http://127.0.0.1:5500`)

**Stop:** Click "Go Live" button in VS Code status bar

---

### Method 5: XAMPP (Windows - Full Stack)

**Requirements:** XAMPP installed

1. **Install XAMPP:**
   - Download from: https://www.apachefriends.org/
   - Install to `C:\xampp`

2. **Setup:**
   - Copy project folder to `C:\xampp\htdocs\signals`
   - Start Apache from XAMPP Control Panel

3. **Access:**
   - Open browser → `http://localhost/signals`

---

## 🔧 Configuration Needed

### 1. Supabase Configuration
- Already configured in `js/supabase-config.js`
- No changes needed for local hosting
- Uses your existing Supabase project

### 2. CORS Issues (if any)
- If you see CORS errors, use `http-server` with `--cors` flag
- Or configure your server to allow CORS

### 3. File Paths
- All paths are relative (`js/lecturer.js`)
- Should work without modification
- If issues, ensure you're running from project root

---

## ✅ Testing Checklist

After starting local server:

1. ✅ Open `http://localhost:8000` (or your port)
2. ✅ Login page loads correctly
3. ✅ Can login as lecturer
4. ✅ Lecturer dashboard loads
5. ✅ Can upload materials (test the fix!)
6. ✅ No console errors (F12 → Console)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Use different port
python -m http.server 8080
# Or
http-server -p 8080
```

### CORS Errors
- Use `http-server --cors` instead
- Or configure server headers

### Files Not Loading
- Ensure you're in the project root directory
- Check file paths are correct
- Verify server is serving from correct directory

### Supabase Connection Issues
- Check internet connection
- Verify Supabase URL/key in `js/supabase-config.js`
- Check browser console for errors

---

## 📝 Quick Start Command (Copy & Paste)

### Windows PowerShell:
```powershell
cd "C:\Users\FRANK KOJO DOGBE\OneDrive\Desktop\system fot military"
python -m http.server 8000
```

### Mac/Linux Terminal:
```bash
cd ~/Desktop/system\ fot\ military
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

---

## 🎯 Recommended for You

**Best Option:** **VS Code Live Server**
- Easiest to use
- Auto-refresh on file changes
- No command line needed
- Perfect for testing fixes

**Second Best:** **Python http.server**
- Built into Python (usually pre-installed)
- Simple one command
- Works everywhere

---

## 📚 Additional Notes

- **No database setup needed** - Uses Supabase cloud database
- **No build process** - Static HTML/JS files
- **No dependencies** - Everything is in the repo
- **Works offline** (except Supabase calls need internet)

---

**Ready to test?** Choose a method above and start testing the material upload fix locally!
