# Production Setup Guide
## Complete Implementation Instructions for All New Features

This guide provides step-by-step instructions for implementing all the production-ready features requested.

---

## 📋 Table of Contents

1. [Supabase Row Level Security (RLS) Policies](#1-supabase-row-level-security-rls-policies)
2. [Server-Side CSRF Validation](#2-server-side-csrf-validation)
3. [HTTPS Enforcement and Security Headers](#3-https-enforcement-and-security-headers)
4. [Performance Optimization](#4-performance-optimization)
5. [Error Monitoring and Logging](#5-error-monitoring-and-logging)
6. [Enhanced Word Document Parser](#6-enhanced-word-document-parser)
7. [Student Progress Tracking Dashboard](#7-student-progress-tracking-dashboard)
8. [Export Exam Results (PDF/Excel)](#8-export-exam-results-pdfexcel)

---

## 1. Supabase Row Level Security (RLS) Policies

### Files Created:
- `supabase/rls-policies.sql`

### Implementation Steps:

#### Step 1.1: Create Sessions Table (Required for Custom Auth)

Run this SQL in Supabase SQL Editor:

```sql
-- Create sessions table for custom authentication
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Cleanup expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### Step 1.2: Update Helper Function

**IMPORTANT:** The `get_current_user_id()` function in `rls-policies.sql` needs to be updated based on your authentication method:

**Option A: Using Session Tokens (Recommended for Custom Auth)**

```sql
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
    session_token TEXT;
    user_uuid UUID;
BEGIN
    -- Get token from request header (if using Supabase Edge Functions)
    -- For direct client access with custom auth, you'll need to pass user_id as a parameter
    -- OR use a service role key that bypasses RLS
    
    -- For now, this is a placeholder - implement based on your auth flow
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Option B: Migrate to Supabase Auth (Recommended for Production)**

If you migrate to Supabase Auth, replace `get_current_user_id()` with `auth.uid()` throughout the policies:

```sql
-- Replace get_current_user_id() with auth.uid() in all policies
-- Example:
CREATE POLICY "Lecturers can view own exams"
    ON exams FOR SELECT
    USING (lecturer_id = auth.uid());
```

#### Step 1.3: Enable RLS Policies

1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/rls-policies.sql`
3. **Note:** Review and adapt `get_current_user_id()` function based on your authentication method
4. Test each policy with sample data

#### Step 1.4: Testing RLS

```sql
-- Test as lecturer (replace USER_ID with actual lecturer ID)
SET request.jwt.claims = '{"sub": "USER_ID"}';
SELECT * FROM exams; -- Should only show lecturer's exams

-- Test as student
SET request.jwt.claims = '{"sub": "STUDENT_ID"}';
SELECT * FROM exams; -- Should only show active exams for student's class
```

**⚠️ Important Notes:**
- RLS requires Supabase Auth OR custom session management
- Current implementation uses custom auth, so RLS policies serve as templates
- For production with custom auth, consider:
  - Using Supabase Edge Functions to validate sessions
  - Storing user_id in request context
  - OR using service role key with application-level authorization checks (current approach)

---

## 2. Server-Side CSRF Validation

### Files Created:
- `supabase/functions/csrf-validate/index.ts`
- `supabase/functions/csrf-validate/README.md`

### Implementation Steps:

#### Step 2.1: Install Supabase CLI

```bash
npm install -g supabase
```

#### Step 2.2: Login to Supabase

```bash
supabase login
```

#### Step 2.3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### Step 2.4: Deploy Edge Function

```bash
supabase functions deploy csrf-validate
```

#### Step 2.5: Update Client-Side Code

Update form submissions to call the Edge Function:

```javascript
// In js/auth.js or exam-portal/login.html
async function validateCSRFOnServer(token) {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/csrf-validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'x-csrf-token': token
            }
        });
        
        const result = await response.json();
        return result.valid;
    } catch (error) {
        console.error('Server CSRF validation error:', error);
        return false; // Fail closed for security
    }
}

// Use in form submission
if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getCSRFToken) {
    const token = SecurityUtils.getCSRFToken();
    const isValid = await validateCSRFOnServer(token);
    if (!isValid) {
        showError('Security validation failed. Please refresh and try again.');
        return;
    }
}
```

**Note:** This is optional enhancement. Current client-side CSRF protection is already implemented.

---

## 3. HTTPS Enforcement and Security Headers

### Files Created:
- `vercel.json`

### Implementation Steps:

#### Step 3.1: Deploy to Vercel

The `vercel.json` file is automatically read by Vercel. After pushing to GitHub:

1. Vercel will automatically detect `vercel.json`
2. Security headers will be applied to all routes
3. HTTPS will be enforced automatically (Vercel provides HTTPS by default)

#### Step 3.2: Verify Headers

After deployment, check headers using browser DevTools:

1. Open Network tab
2. Reload page
3. Click on any request
4. Check Response Headers:
   - `X-Content-Type-Options: nosniff` ✅
   - `X-Frame-Options: DENY` ✅
   - `Strict-Transport-Security: ...` ✅
   - `Content-Security-Policy: ...` ✅

#### Step 3.3: Test HTTPS Redirect

1. Try accessing: `http://your-domain.vercel.app`
2. Should automatically redirect to `https://your-domain.vercel.app`

#### Step 3.4: Customize CSP (Optional)

If you need to allow additional sources (e.g., external images), update CSP in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)\\.html",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://YOUR-CDN.com; ..."
        }
      ]
    }
  ]
}
```

---

## 4. Performance Optimization

### Files Created:
- `js/performance.js`

### Implementation Steps:

#### Step 4.1: Enable Image Lazy Loading

Images are automatically lazy-loaded if you add `data-src` attribute:

**Before:**
```html
<img src="images/logo.jpg" alt="Logo">
```

**After:**
```html
<img data-src="images/logo.jpg" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" alt="Logo" class="lazy-load">
```

Or use the utility function:

```javascript
// Convert existing images to lazy-load
if (typeof PerformanceUtils !== 'undefined') {
    PerformanceUtils.convertImagesToLazy();
}
```

#### Step 4.2: Compress Images Before Upload

In material upload form (`js/lecturer.js`):

```javascript
// Before uploading, compress if image
if (file.type.startsWith('image/')) {
    try {
        const compressedFile = await PerformanceUtils.compressImage(file, 1920, 1080, 0.8);
        file = compressedFile; // Use compressed version
    } catch (error) {
        console.warn('Image compression failed, using original:', error);
    }
}
```

#### Step 4.3: Performance Monitoring

Performance monitoring is automatically enabled. Check browser console for:
- LCP (Largest Contentful Paint) metrics
- FID (First Input Delay) metrics
- Page load times

Metrics are automatically logged to error monitoring if available.

---

## 5. Error Monitoring and Logging

### Files Created:
- `js/error-monitoring.js`

### Implementation Steps:

#### Step 5.1: Set Up Sentry (Recommended)

1. **Create Sentry Account:**
   - Go to https://sentry.io
   - Create a new project
   - Select "JavaScript" platform
   - Copy your DSN

2. **Add Sentry SDK to HTML:**

Add before `</head>` in `index.html`:

```html
<script src="https://browser.sentry-cdn.com/7.81.0/bundle.min.js" 
        integrity="sha384-0qEQQJNxGX8cX6jK0Xz0UeUQqPe5ZXbZXlCcBJCzNQZh7S3hO1iGQ2VvhzB2hx3o" 
        crossorigin="anonymous"></script>
```

3. **Configure Error Monitoring:**

In `index.html` or main JS file:

```javascript
// Configure error monitoring with Sentry DSN
window.ERROR_MONITORING_CONFIG = {
    enabled: true,
    dsn: 'YOUR_SENTRY_DSN_HERE',
    environment: 'production' // or 'development'
};

// ErrorMonitoring will auto-initialize when the script loads
```

#### Step 5.2: Alternative: Custom Error Logging

If you don't want to use Sentry, errors are automatically stored locally:

```javascript
// View stored errors (for admin/debugging)
const errors = ErrorMonitoring.getStoredErrors();
console.log(errors);

// Clear stored errors
ErrorMonitoring.clearStoredErrors();
```

#### Step 5.3: Wrap Async Functions (Optional)

For better error tracking, wrap async functions:

```javascript
// Instead of:
async function myFunction() { ... }

// Use:
const myFunction = withErrorHandling(async function() {
    // Your code
}, 'myFunction context');
```

---

## 6. Enhanced Word Document Parser

### Files Created:
- `exam-portal/js/enhanced-word-parser.js`

### Implementation Steps:

#### Step 6.1: The Enhanced Parser is Already Integrated

The enhanced parser is automatically used if available. The system falls back to the original parser if not loaded.

#### Step 6.2: Supported Formats

The enhanced parser supports multiple question formats:

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

#### Step 6.3: Testing the Parser

1. Create a Word document with questions in one of the supported formats
2. Upload via "Upload Word Document" button in exam portal
3. Check console for parsing details
4. Review parsed questions before saving

---

## 7. Student Progress Tracking Dashboard

### Files Created:
- `exam-portal/js/student-progress-dashboard.js`

### Implementation Steps:

#### Step 7.1: Dashboard is Already Integrated

The progress dashboard is automatically available in the student dashboard.

#### Step 7.2: Accessing the Dashboard

1. Log in as student
2. Go to Student Dashboard (`student-dashboard.html`)
3. Click "📝 Exam Performance" tab
4. View comprehensive progress metrics

#### Step 7.3: Features Included

- Overall statistics (completed exams, average score, completion rate)
- Grade distribution (A, B, C, D, F breakdown)
- Subject-wise performance breakdown
- Recent exam results table
- Visual progress indicators

---

## 8. Export Exam Results (PDF/Excel)

### Files Created:
- `exam-portal/js/export-results.js`

### Implementation Steps:

#### Step 8.1: Add Required Libraries

The export functions automatically load required libraries from CDN:
- **PDF:** jsPDF (loads automatically)
- **Excel:** SheetJS/XLSX (loads automatically)

No manual installation needed!

#### Step 8.2: Using Export Functions

**For Lecturers:**

1. Go to Exam Portal → View Stats for any exam
2. Click "📄 Export to PDF" or "📊 Export to Excel"
3. File downloads automatically

**Programmatic Usage:**

```javascript
// Export to PDF
await exportResultsToPDF(examId, 'Exam Title');

// Export to Excel
await exportResultsToExcel(examId, 'Exam Title');
```

#### Step 8.3: Export Features

**PDF Export Includes:**
- Exam information header
- Student results table (sorted by score)
- Summary statistics
- Grade distribution
- Professional formatting

**Excel Export Includes:**
- Results sheet with all student data
- Summary statistics
- Exam metadata sheet
- Formatted columns with appropriate widths

---

## 🚀 Quick Start Checklist

### Immediate Actions (No Configuration Needed):

- ✅ **HTTPS & Security Headers:** Already configured in `vercel.json` (auto-applied on Vercel)
- ✅ **Performance Optimization:** Scripts loaded, auto-initializes
- ✅ **Error Monitoring:** Scripts loaded, works with local storage (add Sentry DSN for cloud logging)
- ✅ **Enhanced Word Parser:** Integrated and ready to use
- ✅ **Progress Dashboard:** Integrated in student dashboard
- ✅ **Export Functionality:** Ready to use (libraries load automatically)

### Configuration Required:

- ⚠️ **RLS Policies:** Requires authentication method decision (Supabase Auth vs Custom Sessions)
- ⚠️ **Server-Side CSRF:** Requires Supabase Edge Functions deployment (optional enhancement)
- ⚠️ **Sentry Integration:** Requires Sentry account and DSN (optional but recommended)

---

## 📝 File Structure After Implementation

```
system fot military/
├── supabase/
│   ├── rls-policies.sql          # RLS policies (template)
│   └── functions/
│       └── csrf-validate/
│           ├── index.ts          # Edge function
│           └── README.md
├── exam-portal/
│   ├── js/
│   │   ├── enhanced-word-parser.js      # Enhanced parser
│   │   ├── student-progress-dashboard.js # Progress dashboard
│   │   └── export-results.js            # PDF/Excel export
│   └── ...
├── js/
│   ├── performance.js            # Performance utilities
│   └── error-monitoring.js       # Error tracking
├── vercel.json                   # Vercel config (headers, HTTPS)
└── ...
```

---

## 🔧 Troubleshooting

### RLS Policies Not Working?

**Issue:** `get_current_user_id()` returns NULL

**Solution:**
- If using custom auth: Implement session table and update function
- If using Supabase Auth: Replace `get_current_user_id()` with `auth.uid()`
- For testing: Temporarily use service role key (NOT for production)

### Export Functions Not Working?

**Issue:** Libraries not loading

**Solution:**
- Check browser console for CDN errors
- Ensure internet connection (libraries load from CDN)
- Check browser doesn't block CDN requests

### Performance Monitoring Not Showing?

**Issue:** No metrics in console

**Solution:**
- Ensure `performance.js` is loaded
- Check browser supports Performance API
- Verify no JavaScript errors blocking initialization

### Error Monitoring Not Logging?

**Issue:** Errors not appearing in Sentry/local storage

**Solution:**
- Verify `error-monitoring.js` is loaded
- Check `ERROR_MONITORING_CONFIG.enabled` is `true`
- For Sentry: Verify DSN is correct and project is active

---

## ✅ Testing Checklist

- [ ] RLS policies tested (if implemented)
- [ ] CSRF Edge Function deployed and tested (if implemented)
- [ ] Security headers visible in browser DevTools
- [ ] HTTPS redirect working
- [ ] Images lazy loading correctly
- [ ] Error monitoring capturing errors
- [ ] Performance metrics logging
- [ ] Enhanced Word parser extracting questions correctly
- [ ] Progress dashboard showing accurate data
- [ ] PDF export generating correctly
- [ ] Excel export generating correctly

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all script files are loaded (Network tab)
3. Check Supabase logs (if using Edge Functions)
4. Review error monitoring logs (local storage or Sentry)

---

**Last Updated:** January 2026
**Status:** ✅ All features implemented and ready for configuration
