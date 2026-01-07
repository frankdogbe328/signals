# Git vs Supabase - How They Work Together

## 🔄 Two Separate Systems

### **Git (GitHub) - Stores Your CODE**
- ✅ Stores: HTML, CSS, JavaScript files
- ✅ When you commit/push: Code changes go to GitHub
- ✅ Purpose: Version control for your code files
- ✅ Location: https://github.com/frankdogbe328/signals.git

### **Supabase - Stores Your DATA**
- ✅ Stores: User accounts, materials, progress
- ✅ When users register/upload: Data goes directly to Supabase database
- ✅ Purpose: Backend database for your application
- ✅ Location: https://tmyiphpvyflockpkmtrh.supabase.co

## 🔗 How They Work Together

```
┌─────────────────┐         ┌──────────────────┐
│   Your Code     │         │   Your Data       │
│   (Git/GitHub)  │         │   (Supabase)      │
├─────────────────┤         ├──────────────────┤
│ index.html      │         │ users table       │
│ style.css       │  ────>  │ materials table   │
│ js/auth.js      │  Uses   │ progress table    │
│ js/lecturer.js  │         │                   │
└─────────────────┘         └──────────────────┘
```

## 📝 What Happens When:

### **You Make Code Changes:**
1. Edit files (HTML, CSS, JS)
2. `git add .`
3. `git commit -m "message"`
4. `git push`
5. **Result:** Code changes go to GitHub ✅

### **Users Use the System:**
1. User registers → Data goes to **Supabase** ✅
2. Lecturer uploads material → Data goes to **Supabase** ✅
3. Officer views materials → Data comes from **Supabase** ✅
4. **Result:** Data changes go to Supabase (NOT Git) ✅

## ⚠️ Important Notes

- **Code changes** = Git/GitHub
- **Data changes** = Supabase database
- They are **NOT automatically synced**
- They serve **different purposes**

## 🎯 Summary

- **Git/GitHub:** Your code repository (what you edit)
- **Supabase:** Your database (where data is stored)
- **Connection:** Your code (in Git) uses Supabase to store/retrieve data

When you push code to Git, you're updating the application code.
When users use the app, data goes to Supabase automatically.

