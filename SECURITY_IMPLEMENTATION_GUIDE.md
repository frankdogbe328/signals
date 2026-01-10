# Security Implementation Guide - Next Steps

This guide shows you how to complete the remaining security implementations.

## ✅ Completed Steps

1. ✅ Security utilities module created
2. ✅ Password hashing implemented
3. ✅ Rate limiting added
4. ✅ CSRF protection added to login/registration
5. ✅ File upload validation
6. ✅ Input sanitization
7. ✅ Security.js added to all HTML files

## 🔄 Remaining Steps

### Step 1: Complete Session Management Integration

**What to do:** Replace all `getCurrentUser()` calls with `SecurityUtils.getSecureSession()`

**Files to update:**
- `js/app.js` - Authentication checks
- `exam-portal/js/lecturer-exam.js` - Exam portal authentication
- `exam-portal/js/student-exam.js` - Student exam portal
- `js/lecturer.js` - Lecturer dashboard
- `js/student.js` - Student dashboard

**Example:**

**Before:**
```javascript
const currentUser = getCurrentUser();
if (!currentUser) {
    window.location.href = 'index.html';
    return;
}
```

**After:**
```javascript
let currentUser = null;
if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getSecureSession) {
    const session = SecurityUtils.getSecureSession();
    if (session && session.user) {
        currentUser = session.user;
    }
} else {
    // Fallback to legacy
    currentUser = getCurrentUser();
}

if (!currentUser) {
    window.location.href = 'index.html';
    return;
}
```

---

### Step 2: Add Authorization Checks

**What to do:** Verify users can only access/modify their own resources

**Locations to add checks:**

1. **Exam Management (lecturer-exam.js)**
   - In `viewExamDetails()` - verify exam belongs to lecturer
   - In `updateQuestion()` - verify question belongs to lecturer's exam
   - In `deleteQuestion()` - verify question belongs to lecturer's exam

**Example:**

```javascript
async function viewExamDetails(examId) {
    // Get exam first
    const { data: exam } = await client
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
    
    // Authorization check
    const currentUser = getCurrentUser(); // or from secure session
    if (!currentUser || exam.lecturer_id !== currentUser.id) {
        showError('You do not have permission to view this exam.', 'Access Denied');
        return;
    }
    
    // Continue with function...
}
```

2. **Material Management (lecturer.js)**
   - In `updateMaterial()` - verify material belongs to lecturer
   - In `deleteMaterial()` - verify material belongs to lecturer

**Example:**

```javascript
async function updateMaterial(materialId, materialData) {
    // Get material first
    const material = await getMaterialById(materialId);
    
    // Authorization check
    const currentUser = getCurrentUser();
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.verifyResourceOwnership) {
        if (!SecurityUtils.verifyResourceOwnership(currentUser, material, 'uploaded_by')) {
            showError('You do not have permission to modify this material.', 'Access Denied');
            return;
        }
    }
    
    // Continue with update...
}
```

3. **Student Exam Access (student-exam.js)**
   - Verify student can only see exams for their class
   - Verify student can only submit their own exam attempts

**Example:**

```javascript
async function loadExams() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Get exams only for student's class
    const { data: exams } = await client
        .from('exams')
        .select('*')
        .eq('class_id', currentUser.class) // Only student's class
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    
    displayExams(exams || []);
}
```

---

### Step 3: Add CSRF Protection to Remaining Forms

**What to do:** Add CSRF validation to all form submissions

**Forms that need CSRF protection:**
- Material upload form (`js/lecturer.js` - `handleUploadForm`)
- Exam creation form (`exam-portal/js/lecturer-exam.js` - `handleCreateExam`)
- Question form (`exam-portal/js/lecturer-exam.js` - `handleQuestionFormSubmit`)
- Lecturer subject registration (`js/lecturer.js` - `registerLecturerForSubject`)

**Example:**

```javascript
async function handleCreateExam(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Validate CSRF token
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        if (!SecurityUtils.validateFormCSRFToken(form)) {
            showError('Security token validation failed. Please refresh the page and try again.', 'Security Error');
            return;
        }
    }
    
    // Continue with form processing...
}
```

**Note:** CSRF tokens are automatically added to forms by `security.js`. You just need to validate them on submission.

---

### Step 4: Enhance Error Handling

**What to do:** Ensure error messages don't leak sensitive information

**Guidelines:**
- Use generic error messages for authentication failures
- Don't reveal if username/email exists
- Don't expose database structure in errors
- Log detailed errors server-side, show user-friendly messages

**Example:**

**Bad:**
```javascript
catch (error) {
    showError(`Database error: ${error.message}`, 'Error');
    // Reveals database structure
}
```

**Good:**
```javascript
catch (error) {
    console.error('Exam creation error:', error); // Log details
    showError('Failed to create exam. Please try again.', 'Error');
    // Generic message for user
}
```

---

### Step 5: Add Input Validation to All Form Fields

**What to do:** Validate and sanitize ALL user inputs before processing

**Example:**

```javascript
const examTitle = document.getElementById('examTitle').value;
const sanitizedTitle = SecurityUtils ? SecurityUtils.sanitizeInput(examTitle) : examTitle.trim();

// Validate length
if (sanitizedTitle.length < 3 || sanitizedTitle.length > 200) {
    showError('Exam title must be between 3 and 200 characters.', 'Validation Error');
    return;
}
```

---

### Step 6: Implement Logout with Session Cleanup

**What to do:** Ensure secure session cleanup on logout

**Update logout function:**

```javascript
function logout() {
    // Clear secure session
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
        SecurityUtils.clearSecureSession();
    }
    
    // Clear legacy session
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    
    // Clear CSRF token
    sessionStorage.removeItem('csrfToken');
    
    // Redirect to login
    window.location.href = 'index.html';
}
```

---

## 🧪 Testing Checklist

After implementing each step, test:

### Session Management
- [ ] Users are logged out after 8 hours
- [ ] Session expires correctly
- [ ] Users can't access protected pages without valid session
- [ ] Legacy sessions still work (during migration)

### Authorization
- [ ] Lecturers can only see their own exams
- [ ] Lecturers can only modify their own materials
- [ ] Students can only see exams for their class
- [ ] Students can only submit their own exam attempts
- [ ] Error messages shown for unauthorized access

### CSRF Protection
- [ ] Forms include CSRF tokens
- [ ] Form submission fails without valid token
- [ ] Tokens are unique per session
- [ ] Tokens refresh on page reload

### Input Validation
- [ ] XSS attempts are blocked
- [ ] SQL injection attempts fail safely
- [ ] File uploads are validated
- [ ] Long inputs are truncated/rejected

---

## 📝 Quick Implementation Template

Here's a template you can use for any protected function:

```javascript
async function protectedFunction(resourceId) {
    // 1. Check authentication
    let currentUser = null;
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getSecureSession) {
        const session = SecurityUtils.getSecureSession();
        currentUser = session ? session.user : null;
    } else {
        currentUser = getCurrentUser();
    }
    
    if (!currentUser) {
        showError('You must be logged in to perform this action.', 'Authentication Required');
        window.location.href = 'index.html';
        return;
    }
    
    // 2. Get resource
    const resource = await getResourceById(resourceId);
    if (!resource) {
        showError('Resource not found.', 'Error');
        return;
    }
    
    // 3. Check authorization
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.verifyResourceOwnership) {
        if (!SecurityUtils.verifyResourceOwnership(currentUser, resource)) {
            showError('You do not have permission to access this resource.', 'Access Denied');
            return;
        }
    }
    
    // 4. Sanitize inputs (if any)
    // const input = SecurityUtils ? SecurityUtils.sanitizeInput(userInput) : userInput.trim();
    
    // 5. Perform action
    try {
        // Your code here
    } catch (error) {
        console.error('Error in protectedFunction:', error); // Log details
        showError('An error occurred. Please try again.', 'Error'); // Generic message
    }
}
```

---

## 🚀 Priority Order

Implement in this order for maximum security impact:

1. **Session Management** (High Priority)
   - Prevents unauthorized access
   - Quick to implement
   - High security value

2. **Authorization Checks** (High Priority)
   - Prevents data breaches
   - Protects user privacy
   - Critical for exam system

3. **CSRF Protection** (Medium Priority)
   - Prevents cross-site attacks
   - Already partially implemented
   - Complete remaining forms

4. **Error Handling** (Medium Priority)
   - Prevents information leakage
   - Improves user experience
   - Easy to implement

5. **Enhanced Input Validation** (Low Priority)
   - Defense in depth
   - Already mostly implemented
   - Fine-tune edge cases

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify `security.js` is loaded (check Network tab)
3. Ensure SecurityUtils is available: `console.log(typeof SecurityUtils)`
4. Check session storage: `console.log(sessionStorage.getItem('secureSession'))`

---

**Last Updated:** January 2026