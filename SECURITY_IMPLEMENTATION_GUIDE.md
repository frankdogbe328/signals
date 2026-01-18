# Security Implementation Guide
## Quick Start - Top Priority Security Features

This guide provides step-by-step instructions for implementing the most critical security features.

---

## 🔴 Priority 1: Immediate Implementation

### 1. Add Content Security Policy (CSP) Headers

**For Static HTML files:**

Add this meta tag to the `<head>` section of ALL HTML files (`index.html`, `lecturer-dashboard.html`, `student-dashboard.html`, etc.):

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.supabase.co; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">
```

**For Apache servers:**

Use the `.htaccess` file provided in the root directory.

**For other servers:**

Configure security headers in your server configuration (Nginx, Cloudflare, etc.).

---

### 2. Enforce HTTPS

**At Hosting Level (Recommended):**
- Enable "Force HTTPS" in your hosting control panel
- Use Cloudflare or similar CDN to enforce HTTPS
- Obtain SSL certificate (free from Let's Encrypt)

**Via .htaccess (Apache only):**
- Already included in the `.htaccess` file provided

---

### 3. Server-Side Rate Limiting

**Option A: Using Supabase Row Level Security (RLS)**

Create a rate limiting table in Supabase:

```sql
-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- IP address or user_id
    endpoint TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT NOW(),
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, endpoint, window_start);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    v_attempts INTEGER;
    v_window_start TIMESTAMP;
    v_blocked_until TIMESTAMP;
BEGIN
    -- Check if currently blocked
    SELECT blocked_until INTO v_blocked_until
    FROM rate_limits
    WHERE identifier = p_identifier 
      AND endpoint = p_endpoint
      AND blocked_until > NOW()
    LIMIT 1;
    
    IF v_blocked_until IS NOT NULL THEN
        RETURN FALSE; -- Blocked
    END IF;
    
    -- Get or create rate limit record
    INSERT INTO rate_limits (identifier, endpoint, attempts, window_start)
    VALUES (p_identifier, p_endpoint, 1, NOW())
    ON CONFLICT (identifier, endpoint) 
    DO UPDATE SET
        attempts = CASE 
            WHEN NOW() - rate_limits.window_start < (p_window_minutes || ' minutes')::INTERVAL
            THEN rate_limits.attempts + 1
            ELSE 1
        END,
        window_start = CASE 
            WHEN NOW() - rate_limits.window_start < (p_window_minutes || ' minutes')::INTERVAL
            THEN rate_limits.window_start
            ELSE NOW()
        END,
        updated_at = NOW()
    RETURNING attempts, window_start INTO v_attempts, v_window_start;
    
    -- Block if exceeded max attempts
    IF v_attempts >= p_max_attempts THEN
        UPDATE rate_limits
        SET blocked_until = NOW() + (30 || ' minutes')::INTERVAL
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        RETURN FALSE; -- Blocked
    END IF;
    
    RETURN TRUE; -- Allowed
END;
$$ LANGUAGE plpgsql;
```

**Option B: Using Supabase Edge Functions**

Create an Edge Function that wraps authentication endpoints with rate limiting.

---

### 4. Add Security HTTP Headers

**Already provided in `.htaccess` file:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security (HSTS)

**To use:**
1. Upload `.htaccess` to your server root directory (if using Apache)
2. For other servers, configure these headers in your server config

---

## 🟡 Priority 2: Server-Side Validation

### Implement Supabase Database Functions for Validation

**Example: User Registration Validation**

```sql
-- Function to validate and create user
CREATE OR REPLACE FUNCTION create_user_validated(
    p_username TEXT,
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_role TEXT DEFAULT 'student'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_validation_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Validate username (3-20 chars, alphanumeric + underscore)
    IF NOT (p_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
        v_validation_errors := array_append(v_validation_errors, 'Invalid username format');
    END IF;
    
    -- Validate email
    IF NOT (p_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') THEN
        v_validation_errors := array_append(v_validation_errors, 'Invalid email format');
    END IF;
    
    -- Validate password length
    IF LENGTH(p_password) < 8 OR LENGTH(p_password) > 128 THEN
        v_validation_errors := array_append(v_validation_errors, 'Password must be 8-128 characters');
    END IF;
    
    -- Validate name length
    IF LENGTH(p_name) < 2 OR LENGTH(p_name) > 100 THEN
        v_validation_errors := array_append(v_validation_errors, 'Name must be 2-100 characters');
    END IF;
    
    -- Validate role
    IF p_role NOT IN ('student', 'lecturer', 'admin') THEN
        v_validation_errors := array_append(v_validation_errors, 'Invalid role');
    END IF;
    
    -- Return errors if any
    IF array_length(v_validation_errors, 1) > 0 THEN
        RETURN json_build_object(
            'success', false,
            'errors', v_validation_errors
        );
    END IF;
    
    -- Proceed with user creation (password should already be hashed client-side)
    -- ... rest of user creation logic ...
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🟢 Priority 3: Account Lockout

### Add Account Lockout to Login Flow

**In `js/auth.js`, add after rate limit check:**

```javascript
// Check if account is locked
const lockoutKey = `accountLockout_${username}`;
const lockoutData = localStorage.getItem(lockoutKey);
if (lockoutData) {
    const lockout = JSON.parse(lockoutData);
    if (lockout.lockedUntil > Date.now()) {
        const minutesRemaining = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
        errorMessage.textContent = `Account temporarily locked. Please try again in ${minutesRemaining} minute(s).`;
        errorMessage.classList.add('show');
        return;
    } else {
        // Lockout expired, clear it
        localStorage.removeItem(lockoutKey);
    }
}

// After failed login attempt:
const failedAttempts = parseInt(localStorage.getItem(`failedAttempts_${username}`) || '0');
localStorage.setItem(`failedAttempts_${username}`, (failedAttempts + 1).toString());

if (failedAttempts + 1 >= 5) {
    // Lock account for 30 minutes
    const lockoutUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
    localStorage.setItem(lockoutKey, JSON.stringify({
        lockedUntil: lockoutUntil,
        lockedAt: Date.now()
    }));
    errorMessage.textContent = 'Too many failed attempts. Account locked for 30 minutes.';
    errorMessage.classList.add('show');
    return;
}

// On successful login, clear failed attempts
localStorage.removeItem(`failedAttempts_${username}`);
localStorage.removeItem(lockoutKey);
```

**Note:** For production, implement this server-side using Supabase RLS or Edge Functions.

---

## 🔵 Priority 4: Audit Logging

### Create Audit Log Table

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    username TEXT,
    action TEXT NOT NULL, -- 'login', 'logout', 'upload', 'delete', etc.
    resource_type TEXT, -- 'material', 'user', 'exam', etc.
    resource_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### JavaScript Function to Log Actions

```javascript
async function logAuditAction(action, resourceType = null, resourceId = null, success = true, errorMessage = null, metadata = {}) {
    const currentUser = getCurrentUser();
    
    const logData = {
        user_id: currentUser?.id || null,
        username: currentUser?.username || 'anonymous',
        action: action,
        resource_type: resourceType,
        resource_id: resourceId,
        success: success,
        error_message: errorMessage,
        metadata: metadata
    };
    
    // Try to log to Supabase if available
    if (typeof window.supabaseClient !== 'undefined') {
        try {
            await window.supabaseClient
                .from('audit_logs')
                .insert(logData);
        } catch (err) {
            console.error('Failed to log audit action:', err);
            // Fallback to localStorage for critical logs
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            logs.push({ ...logData, timestamp: Date.now() });
            localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-100))); // Keep last 100
        }
    }
}
```

---

## 📋 Implementation Checklist

- [ ] Add CSP headers to all HTML files
- [ ] Upload `.htaccess` file (if using Apache)
- [ ] Enable HTTPS enforcement
- [ ] Implement server-side rate limiting (RLS or Edge Functions)
- [ ] Add account lockout functionality
- [ ] Create audit_logs table in Supabase
- [ ] Add audit logging calls to critical operations
- [ ] Test all security features
- [ ] Review `SECURITY_ANALYSIS.md` for additional recommendations

---

## 📚 Additional Resources

- See `SECURITY_ANALYSIS.md` for complete security analysis
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- OWASP Security Guidelines: https://owasp.org/www-project-top-ten/

---

**Note:** Some features require server-side implementation. For Supabase, use RLS policies or Edge Functions for server-side security.
