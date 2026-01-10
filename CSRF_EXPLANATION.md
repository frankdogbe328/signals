# CSRF Protection Explained

## What is CSRF Protection?

CSRF (Cross-Site Request Forgery) protection **prevents malicious websites from submitting forms on your behalf** without your knowledge. It does NOT verify users - user verification is done separately through authentication (login).

---

## How CSRF Protection Works in Your System

### Step 1: Token Generation (When Page Loads)

```javascript
// Location: js/security.js, lines 315-334

function generateCSRFToken() {
    // Creates a random 64-character hexadecimal token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getCSRFToken() {
    // Gets existing token OR creates new one
    let token = sessionStorage.getItem('csrfToken');
    if (!token) {
        token = generateCSRFToken();
        sessionStorage.setItem('csrfToken', token); // Stores in browser
    }
    return token;
}
```

**What happens:**
- When your page loads, a unique random token is generated
- This token is stored in the browser's `sessionStorage` (like a temporary cookie)
- Example token: `a1b2c3d4e5f6...` (64 characters)

---

### Step 2: Token Injection (Automatic)

```javascript
// Location: js/security.js, lines 466-485

function addCSRFTokenToForm(form) {
    // Creates a hidden input field with the token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_csrf_token';
    tokenInput.value = getCSRFToken(); // Gets the stored token
    form.appendChild(tokenInput); // Adds to form
}
```

**What happens:**
- Every form on your page automatically gets a hidden field added:
  ```html
  <input type="hidden" name="_csrf_token" value="a1b2c3d4e5f6...">
  ```

**Visual Example:**
```html
<!-- Your form BEFORE -->
<form id="loginForm">
    <input type="text" name="username">
    <input type="password" name="password">
    <button type="submit">Login</button>
</form>

<!-- Your form AFTER (automatically) -->
<form id="loginForm">
    <input type="text" name="username">
    <input type="password" name="password">
    <input type="hidden" name="_csrf_token" value="a1b2c3d4e5f6..."> <!-- AUTO-ADDED -->
    <button type="submit">Login</button>
</form>
```

---

### Step 3: Token Validation (When Form is Submitted)

```javascript
// Location: js/security.js, lines 490-516

function validateFormCSRFToken(form) {
    // 1. Gets the token from the form
    const tokenInput = form.querySelector('input[name="_csrf_token"]');
    const submittedToken = tokenInput.value;
    
    // 2. Gets the stored token from sessionStorage
    const storedToken = sessionStorage.getItem('csrfToken');
    
    // 3. Compares them - they MUST match
    return storedToken === submittedToken;
}
```

**What happens when user submits form:**
1. Form includes the hidden `_csrf_token` field with value `a1b2c3d4e5f6...`
2. JavaScript extracts this token from the form
3. JavaScript gets the stored token from `sessionStorage`
4. **If they match** → Form submission is allowed ✅
5. **If they DON'T match** → Form submission is blocked ❌

---

### Step 4: Usage in Your Forms (Example: Login)

```javascript
// Location: js/auth.js, lines 9-48

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    
    // 1. Ensure token exists in form
    SecurityUtils.addCSRFTokenToForm(form);
    
    // 2. Validate the token
    if (!SecurityUtils.validateFormCSRFToken(form)) {
        // ❌ BLOCKED - Token mismatch!
        errorMessage.textContent = 'Security token validation failed. Please refresh the page and try again.';
        return; // Stop form submission
    }
    
    // 3. If validation passes, continue with login
    // ... rest of login logic
}
```

---

## Why This Protects Against CSRF Attacks

### ❌ WITHOUT CSRF Protection (Vulnerable)

**Scenario:** You're logged into your exam portal. While browsing, you visit a malicious website:

```html
<!-- Malicious website (evil-site.com) -->
<form action="https://your-exam-portal.com/exam-portal/js/lecturer-exam.js" method="POST">
    <input type="hidden" name="examId" value="123">
    <input type="hidden" name="action" value="delete">
</form>
<script>
    document.forms[0].submit(); // Auto-submits!
</script>
```

**Result:** The malicious site can delete your exams without you knowing! 😱

---

### ✅ WITH CSRF Protection (Protected)

**Same scenario, but now:**

1. Malicious website tries to submit the form
2. Form submission is missing the `_csrf_token` (or has wrong token)
3. Your validation function checks: `storedToken === submittedToken`
4. **They DON'T match** → Submission is **BLOCKED** ✅
5. Error message shown: "Security token validation failed"

**Why it works:**
- Malicious websites **cannot access** your `sessionStorage` (same-origin policy)
- They **cannot generate** the correct token (don't know your secret)
- Therefore, their form submissions will **always fail validation**

---

## Important Points

### ❌ CSRF Does NOT:
- **Verify user identity** (that's authentication/login)
- **Check user permissions** (that's authorization - we added this separately)
- **Encrypt data** (tokens are not encrypted, just random)
- **Protect against XSS** (different protection)

### ✅ CSRF DOES:
- **Prevent form submissions from other websites**
- **Ensure form came from your legitimate page**
- **Protect state-changing operations** (create, update, delete)

---

## Token Storage & Security

### Where Tokens Are Stored:
- **Location:** Browser's `sessionStorage`
- **Scope:** Only accessible by JavaScript from the **same origin** (your domain)
- **Lifetime:** Until browser tab is closed (session-based)
- **Visibility:** Other websites **CANNOT** read it (same-origin policy)

### Token Characteristics:
- **Length:** 64 hexadecimal characters (256 bits)
- **Randomness:** Uses `crypto.getRandomValues()` (cryptographically secure)
- **Uniqueness:** Different token for each browser session

---

## Current Implementation Status

### ✅ Forms Protected with CSRF:
1. ✅ Login form (`js/auth.js`)
2. ✅ Registration form (`js/register.js`)
3. ✅ Exam Portal Login (`exam-portal/login.html`)
4. ✅ Create Exam form (`exam-portal/js/lecturer-exam.js`)
5. ✅ Question form (`exam-portal/js/lecturer-exam.js`)
6. ✅ Material Upload form (`js/lecturer.js`)

### 🔄 Automatic Protection:
- All forms get tokens **automatically** via `initializeCSRFProtection()`
- Works for **dynamically created forms** too (MutationObserver)
- Runs on page load automatically

---

## Testing CSRF Protection

### Test 1: Normal Form Submission (Should Work)
1. Open your login page
2. Fill in username/password
3. Submit form
4. **Expected:** Login succeeds ✅

### Test 2: Manual Token Removal (Should Fail)
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `sessionStorage.removeItem('csrfToken')`
4. Try to submit login form
5. **Expected:** "Security token validation failed" ❌

### Test 3: Token Mismatch (Should Fail)
1. Open browser DevTools
2. Find the hidden `_csrf_token` input in the form
3. Change its value to something random
4. Submit form
5. **Expected:** "Security token validation failed" ❌

---

## Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PAGE LOADS                                               │
│    └─> initializeCSRFProtection() runs                      │
│        └─> getCSRFToken() generates/retrieves token         │
│            └─> Token stored in sessionStorage               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FORM DETECTED                                            │
│    └─> addCSRFTokenToForm(form) runs                        │
│        └─> Hidden input added with token value              │
│            <input type="hidden" name="_csrf_token"          │
│                   value="a1b2c3d4...">                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER SUBMITS FORM                                         │
│    └─> handleLogin() or similar handler runs                │
│        └─> validateFormCSRFToken(form) checks:              │
│            ├─> Get token from form input                    │
│            ├─> Get token from sessionStorage                │
│            └─> Compare: formToken === storedToken?          │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐
    │ TOKENS MATCH ✅   │   │ TOKENS DON'T MATCH│
    │                   │   │ ❌                │
    │ Continue with     │   │ Block submission  │
    │ form processing   │   │ Show error        │
    └───────────────────┘   └───────────────────┘
```

---

## Relationship to User Verification

### CSRF Protection ≠ User Verification

**CSRF Protection:**
- ✅ Ensures form came from your legitimate page
- ✅ Prevents cross-site attacks
- ❌ Does NOT check if user is logged in
- ❌ Does NOT check user permissions

**User Verification (Authentication/Authorization):**
- ✅ Checks if user is logged in (`getCurrentUser()`)
- ✅ Verifies user role (`currentUser.role === 'lecturer'`)
- ✅ Checks resource ownership (`exam.lecturer_id === currentUser.id`)
- ❌ Does NOT prevent CSRF attacks

### Both Work Together:

```
Form Submission Flow:
1. ✅ CSRF Check: "Did this form come from our page?"
2. ✅ Authentication Check: "Is user logged in?"
3. ✅ Authorization Check: "Does user have permission?"
4. ✅ Process the request
```

**Example from your code:**
```javascript
async function handleLogin(e) {
    e.preventDefault();
    
    // STEP 1: CSRF Protection
    if (!SecurityUtils.validateFormCSRFToken(form)) {
        return; // Block if token invalid
    }
    
    // STEP 2: User Verification (separate step)
    const user = await getUserFromSupabase(username, password);
    if (!user) {
        return; // Block if credentials invalid
    }
    
    // STEP 3: Set session (authorization)
    SecurityUtils.setSecureSession(user);
}
```

---

## Production Recommendations

### Current Implementation (Client-Side):
- ✅ Works for basic protection
- ⚠️ Tokens stored in `sessionStorage` (client-side)
- ⚠️ Validation happens in JavaScript (can be bypassed if JS disabled)

### Production Best Practices:
1. **Server-Side Validation:** Validate CSRF tokens on the server (Supabase Edge Functions)
2. **SameSite Cookies:** Use HTTP-only cookies for tokens (more secure)
3. **Token Rotation:** Rotate tokens after each use (more secure)
4. **Double-Submit Cookies:** Use cookie + form token pattern

### Current Status:
- ✅ **Good enough for development/testing**
- ⚠️ **Should enhance for production deployment**
- 📝 **Note:** Since you're using Supabase, you could implement server-side validation using Supabase Edge Functions

---

## Summary

**CSRF Protection in your system:**
1. ✅ **Generates** unique random tokens on page load
2. ✅ **Injects** tokens into all forms automatically
3. ✅ **Validates** tokens when forms are submitted
4. ✅ **Blocks** submissions if tokens don't match
5. ✅ **Works** for all forms (login, registration, exam creation, etc.)

**Remember:**
- CSRF protection **doesn't verify users** - it prevents cross-site attacks
- User verification is done **separately** via authentication/authorization checks
- Both work together to secure your system
