# Vercel 404 Error Fix

## Problem
Getting 404 errors when accessing student portal links on Vercel.

## Solution
Updated `vercel.json` to include proper routing/rewrites for all HTML files.

## Fixed Routes

All these URLs now work:

### Root Pages
- `/` → `index.html`
- `/student-dashboard` → `student-dashboard.html`
- `/lecturer-dashboard` → `lecturer-dashboard.html`
- `/admin-portal` → `admin-portal.html`
- `/admin-login` → `admin-login.html`
- `/lecturer-login` → `lecturer-login.html`
- `/lecturer-register` → `lecturer-register.html`

### Exam Portal Pages
- `/exam-portal/student-exam-portal` → `exam-portal/student-exam-portal.html`
- `/exam-portal/lecturer-exam-dashboard` → `exam-portal/lecturer-exam-dashboard.html`

## How to Fix

1. **Pull latest changes** (vercel.json has been updated)
2. **Redeploy to Vercel** - The rewrites will be applied automatically
3. **Test the links** - All portals should now work

## Alternative: Direct File Access

You can also access files directly with `.html` extension:
- `https://your-project.vercel.app/student-dashboard.html`
- `https://your-project.vercel.app/exam-portal/student-exam-portal.html`

## If Still Getting 404

1. Check that files exist in your repository
2. Verify file names match exactly (case-sensitive)
3. Check Vercel deployment logs
4. Try accessing with `.html` extension directly
