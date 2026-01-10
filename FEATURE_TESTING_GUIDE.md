# Feature Testing Guide
## How to Test All New Features

This guide shows you exactly where to find and test each new feature.

---

## 📊 Export Results (PDF/Excel)

### **Location 1: Exam List View**
1. Log in as a **lecturer**
2. Go to **Exam Portal** → **Lecturer Exam Dashboard**
3. You'll see a list of all your exams
4. Each exam card now has **two new buttons**:
   - **📄 PDF** - Export results to PDF
   - **📊 Excel** - Export results to Excel

### **Location 2: Exam Details Modal**
1. Click **"Manage"** on any exam
2. In the exam details modal, you'll see:
   - **📊 View Statistics** button
   - **📄 Export to PDF** button
   - **📊 Export to Excel** button

### **Location 3: Statistics Modal**
1. Click **"View Stats"** on any exam
2. At the top of the statistics modal, you'll see:
   - **📄 Export to PDF** button
   - **📊 Export to Excel** button

### **How to Test:**
1. Make sure you have at least one exam with completed student attempts
2. Click any of the export buttons
3. The file should download automatically
4. **PDF Export** includes:
   - Exam information header
   - Student results table
   - Summary statistics
5. **Excel Export** includes:
   - Results sheet with all student data
   - Summary statistics
   - Exam metadata sheet

### **Troubleshooting:**
- If buttons don't appear: Check browser console (F12) for loading errors
- If export fails: Make sure you have at least one completed exam attempt
- If libraries don't load: Check internet connection (CDN access required)

---

## 📈 Student Progress Dashboard

### **Location:**
1. Log in as a **student**
2. Go to **Student Dashboard** (`student-dashboard.html`)
3. Look for the **"📝 Exam Performance"** tab at the top
4. Click on it to switch from "📚 Materials Progress" to "📝 Exam Performance"

### **What You'll See:**
- **Overall Statistics Cards:**
  - Exams Completed (X/Y)
  - Average Score (%)
  - Completion Rate (%)
  - Pending Exams

- **Grade Distribution:**
  - Count of A, B, C, D, F grades
  - Visual breakdown

- **Performance by Subject:**
  - Average percentage per subject
  - Progress bars
  - Number of exams completed

- **Recent Exam Results Table:**
  - Last 10 exam results
  - Score, percentage, grade
  - Submission date

### **How to Test:**
1. As a student, take at least one exam
2. Go to Student Dashboard
3. Click "📝 Exam Performance" tab
4. Verify your statistics appear correctly

### **Troubleshooting:**
- If tab doesn't switch: Check browser console for JavaScript errors
- If no data appears: Make sure you've completed at least one exam
- If dashboard is empty: Verify exam attempts have status 'submitted' or 'auto_submitted'

---

## 📄 Enhanced Word Document Parser

### **Location:**
1. Log in as a **lecturer**
2. Go to **Exam Portal** → **Lecturer Exam Dashboard**
3. Click **"Manage"** on any exam (or create a new exam)
4. In the exam details modal, click **"📄 Upload Word Document"**

### **Supported Formats:**

**Format 1: Numbered Questions**
```
1. What is the capital of Ghana?
A) Accra
B) Kumasi
C) Tamale
D) Takoradi
Answer: A

2. Who won the 2022 World Cup?
A) Brazil
B) Argentina
C) France
D) Germany
Answer: B
```

**Format 2: True/False**
```
3. Ghana is in West Africa.
True
False
Answer: True
```

**Format 3: With Marks**
```
4. Explain the theory of relativity. [10 marks]
Answer: Einstein's theory states that...
```

**Format 4: Q1, Q2 format**
```
Q1. What is 2+2?
A) 3
B) 4
C) 5
D) 6
Correct Answer: B
```

### **How to Test:**
1. Create a Word document (.docx) with questions in one of the formats above
2. Click "Upload Word Document" in exam details
3. Select your .docx file
4. Click "Process Document"
5. Watch the progress bar
6. Questions should be automatically parsed and added

### **Enhanced Features:**
- Better recognition of question formats
- Automatic marks detection (e.g., [5 marks])
- Improved option parsing (A) B) C) or A. B. C.)
- True/False auto-detection
- Better handling of multi-line questions and options

### **Troubleshooting:**
- If parsing fails: Check document format matches one of the supported formats
- If no questions found: Ensure questions are numbered (1., 2., Q1, etc.)
- If options not recognized: Use A), B), C) format or A. B. C. format
- Make sure file is .docx (not .doc)

---

## ⚡ Performance Optimization

### **Image Lazy Loading:**
- Automatically enabled on all pages
- Images load only when they're about to enter the viewport
- Check Network tab in DevTools to see images loading on scroll

### **Image Compression:**
- When uploading images in material upload form
- Images are automatically compressed before upload
- Saves bandwidth and storage

### **Performance Monitoring:**
- Open browser console (F12)
- Look for performance metrics:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - Page Load Time
- Metrics are logged if they exceed thresholds

### **How to Test:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check that images load progressively (lazy loading)
5. Check Console tab for performance metrics

---

## 🐛 Error Monitoring

### **Location:**
- Automatically active on all pages
- Errors are logged to browser console
- Errors stored locally (last 10 errors)

### **How to Test:**
1. Open browser console (F12)
2. Trigger a JavaScript error (or wait for one)
3. Check console for error logs
4. Check Application → Local Storage → `errorLog` for stored errors

### **View Stored Errors:**
Open browser console and run:
```javascript
// View stored errors
const errors = ErrorMonitoring.getStoredErrors();
console.table(errors);

// Clear stored errors
ErrorMonitoring.clearStoredErrors();
```

### **Sentry Integration (Optional):**
1. Get Sentry DSN from https://sentry.io
2. Add to `index.html`:
```javascript
window.ERROR_MONITORING_CONFIG = {
    enabled: true,
    dsn: 'YOUR_SENTRY_DSN_HERE',
    environment: 'production'
};
```

---

## 🔒 Security Features

### **HTTPS & Security Headers:**
- Automatically applied on Vercel deployment
- Check headers in DevTools → Network → Response Headers:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy`

### **CSRF Protection:**
- Already implemented in all forms
- Check Network tab when submitting forms
- Look for `x-csrf-token` header

---

## ✅ Quick Test Checklist

- [ ] **Export PDF:** Click export button, verify PDF downloads with results
- [ ] **Export Excel:** Click export button, verify Excel file downloads
- [ ] **Progress Dashboard:** Log in as student, check "Exam Performance" tab
- [ ] **Word Parser:** Upload Word document with questions, verify parsing
- [ ] **Performance:** Check console for performance metrics
- [ ] **Error Monitoring:** Check console for error logs
- [ ] **Lazy Loading:** Scroll page, verify images load on scroll
- [ ] **Security Headers:** Check DevTools → Network → Headers (after Vercel deploy)

---

## 🐛 Common Issues & Solutions

### Export Buttons Not Showing?
**Solution:** 
1. Check browser console (F12) for errors
2. Verify `export-results.js` is loaded (Network tab)
3. Make sure you're logged in as lecturer
4. Refresh the page

### Progress Dashboard Empty?
**Solution:**
1. Make sure you've completed at least one exam as a student
2. Check exam attempts have status 'submitted' or 'auto_submitted'
3. Verify your class matches exam class_id
4. Check browser console for errors

### Word Parser Not Working?
**Solution:**
1. Make sure file is .docx format (not .doc)
2. Check document follows one of the supported formats
3. Verify mammoth.js library is loaded (Network tab)
4. Check browser console for parsing errors

### Libraries Not Loading?
**Solution:**
1. Check internet connection (CDN access required)
2. Verify CDN URLs are accessible
3. Check browser console for CORS or network errors
4. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

---

## 📞 Need Help?

1. **Check Browser Console:** Press F12, look for errors
2. **Check Network Tab:** Verify all scripts are loading
3. **Check Application Tab:** Verify localStorage/sessionStorage
4. **Read PRODUCTION_SETUP_GUIDE.md:** Detailed setup instructions

---

**Last Updated:** January 2026
