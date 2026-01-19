// Authentication handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Ensure CSRF token exists before validation
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.addCSRFTokenToForm) {
        SecurityUtils.addCSRFTokenToForm(form);
    }
    
    // Validate CSRF token (with fallback for migration period)
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        const isValid = SecurityUtils.validateFormCSRFToken(form);
        if (!isValid) {
            // During migration, try once more by regenerating token
            try {
                if (typeof SecurityUtils.getCSRFToken === 'function') {
                    sessionStorage.removeItem('csrfToken');
                    SecurityUtils.getCSRFToken();
                    SecurityUtils.addCSRFTokenToForm(form);
                    
                    // Try validation again
                    if (!SecurityUtils.validateFormCSRFToken(form)) {
                        const errorMessage = document.getElementById('errorMessage');
                        if (errorMessage) {
                            errorMessage.textContent = 'Security token validation failed. Please refresh the page and try again.';
                            errorMessage.classList.add('show');
                        }
                        return;
                    }
                } else {
                    throw new Error('CSRF token functions not available');
                }
            } catch (err) {
                console.error('CSRF token error:', err);
                // Allow submission during migration period
                console.warn('Allowing form submission due to CSRF token error during migration');
            }
        }
    }
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userTypeInput = document.getElementById('userType');
    const errorMessage = document.getElementById('errorMessage');
    
    // Sanitize inputs - handle both mobile (with spaces) and laptop (without spaces)
    const rawUsername = usernameInput ? usernameInput.value : '';
    const rawPassword = passwordInput ? passwordInput.value : '';
    
    // Trim whitespace including newlines and special characters that mobile keyboards can add
    const username = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawUsername.trim()) : rawUsername.trim().replace(/\s+/g, ' ').trim();
    
    // IMPORTANT: Use ORIGINAL password (not trimmed) - verification will handle trimming internally
    // This ensures laptop login works (no spaces) while mobile (with spaces) is handled in getUserFromSupabase
    const password = rawPassword; // Keep original - getUserFromSupabase will try both original and trimmed
    
    // Log for debugging (remove in production if sensitive)
    console.log('Login attempt:', { 
        usernameLength: username.length, 
        passwordLength: password.length,
        userType: userTypeInput ? userTypeInput.value : '',
        isMobile: window.innerWidth <= 768
    });
    
    let userType = userTypeInput ? userTypeInput.value : '';
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs
    if (!username || !password || !userType) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Priority 1: Account Lockout - Check if account is locked
    const lockoutKey = `accountLockout_${username}`;
    const lockoutData = localStorage.getItem(lockoutKey);
    if (lockoutData) {
        const lockout = JSON.parse(lockoutData);
        if (lockout.lockedUntil > Date.now()) {
            const minutesRemaining = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
            errorMessage.textContent = `Account temporarily locked due to too many failed attempts. Please try again in ${minutesRemaining} minute(s).`;
            errorMessage.classList.add('show');
            
            // Log lockout check
            if (typeof logAuditAction === 'function') {
                logAuditAction('login_attempt', null, null, false, 'Account locked', { username: username });
            }
            return;
        } else {
            // Lockout expired, clear it
            localStorage.removeItem(lockoutKey);
        }
    }
    
    // Rate limiting check
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.checkRateLimit) {
        const rateLimitKey = `login_${username}`;
        const rateLimit = SecurityUtils.checkRateLimit(rateLimitKey, 5, 3); // 5 attempts per 3 minutes
        
        if (!rateLimit.allowed) {
            errorMessage.textContent = `Too many login attempts. Please try again in ${rateLimit.timeRemaining} minutes.`;
            errorMessage.classList.add('show');
            return;
        }
    }
    
    // Try Supabase first, fallback to localStorage for backward compatibility
    let user = null;
    
    // Check if Supabase is available
    if (typeof getUserFromSupabase === 'function') {
        try {
            // Try to get user - if userType is student but user is lecturer, allow it
            // This allows lecturers to login even if dropdown only shows student
            let searchRole = userType;
            user = await getUserFromSupabase(username, password, searchRole);
            
            // If not found with student role, try lecturer role (for hidden lecturer login)
            if (!user && userType === 'student') {
                user = await getUserFromSupabase(username, password, 'lecturer');
                if (user) {
                    searchRole = 'lecturer'; // Update to actual role
                }
            }
            
            // Verify the user role
            if (user && user.role !== searchRole) {
                console.warn('Role mismatch:', user.role, 'expected:', searchRole);
                // For admin, this is critical - reject if role doesn't match
                if (searchRole === 'admin' && user.role !== 'admin') {
                    user = null;
                    errorMessage.textContent = 'Invalid credentials for admin access.';
                    errorMessage.classList.add('show');
                    return;
                }
            }
            
            // Update userType to actual role for redirect (CRITICAL: Use database role, not dropdown)
            if (user) {
                // Always use the actual role from database, not the dropdown selection
                // This ensures students go to student portal, lecturers to lecturer portal
                userType = user.role || searchRole || userType;
                console.log('Login - Actual user role from database:', user.role);
                console.log('Login - userType set to:', userType);
            }
        } catch (err) {
            console.error('Supabase login error:', err);
            errorMessage.textContent = 'Login failed. Please try again.';
            errorMessage.classList.add('show');
            return;
        }
    }
    
    // Fallback to localStorage if Supabase fails or not available (for migration)
    if (!user && typeof localStorage !== 'undefined') {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            // For localStorage fallback, still attempt password verification if SecurityUtils available
            const potentialUser = users.find(u => u.username === username && u.role === userType);
            if (potentialUser && typeof SecurityUtils !== 'undefined' && SecurityUtils.verifyPassword) {
                const passwordMatch = await SecurityUtils.verifyPassword(password, potentialUser.password);
                if (passwordMatch) {
                    user = potentialUser;
                    delete user.password; // Don't store password in session
                }
            } else if (potentialUser && potentialUser.password === password) {
                // Legacy plaintext support (during migration)
                user = potentialUser;
                delete user.password;
            }
        } catch (err) {
            console.error('LocalStorage login error:', err);
        }
    }
    
    if (user) {
        // Clear rate limit on successful login
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearRateLimit) {
            SecurityUtils.clearRateLimit(`login_${username}`);
        }
        
        // Set secure session
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.setSecureSession) {
            SecurityUtils.setSecureSession(user, 480); // 8 hour session
        }
        
        // Set current user (legacy support)
        setCurrentUser(user);
        
        // Admin login should not happen from main login page
        // If somehow admin tries to login here, redirect to admin login page
        if (userType === 'admin' || (user && user.role === 'admin')) {
            if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
                SecurityUtils.clearSecureSession();
            }
            localStorage.removeItem('currentUser');
            window.location.href = 'admin-login.html';
            return;
        }
        
        // Check for redirect parameter in URL (takes priority) - sanitize redirect
        const urlParams = new URLSearchParams(window.location.search);
        let redirectTo = urlParams.get('redirect');
        
        // Sanitize redirect URL to prevent open redirect vulnerabilities
        if (redirectTo) {
            // Only allow relative paths or same-origin redirects
            try {
                const redirectUrl = new URL(redirectTo, window.location.origin);
                if (redirectUrl.origin !== window.location.origin) {
                    redirectTo = null; // Block cross-origin redirects
                } else {
                    redirectTo = redirectUrl.pathname + redirectUrl.search;
                }
            } catch (e) {
                // If URL parsing fails, treat as relative path
                if (!redirectTo.startsWith('/') && !redirectTo.startsWith('./')) {
                    redirectTo = null;
                }
            }
        }
        
        // Check for portal selection (only for lecturer/student, not admin)
        const portalType = document.getElementById('portalType')?.value || 'lms';
        
        console.log('Login - Portal type:', portalType);
        console.log('Login - Redirect parameter:', redirectTo);
        console.log('Login - User role:', userType);
        
        // If redirect parameter exists and is valid, use it
        if (redirectTo && (redirectTo.includes('exam-portal') || redirectTo.includes('lecturer-dashboard') || redirectTo.includes('student-dashboard') || redirectTo.includes('admin-portal'))) {
            console.log('Login - Redirecting to:', redirectTo);
            setTimeout(() => {
                window.location.href = redirectTo;
            }, 100);
        } else {
            // Redirect based on portal selection
            setTimeout(() => {
                if (portalType === 'exam') {
                    // Redirect to exam portal
                    if (userType === 'lecturer') {
                        window.location.href = 'exam-portal/lecturer-exam-dashboard.html';
                    } else if (userType === 'student') {
                        window.location.href = 'exam-portal/student-exam-portal.html';
                    }
                } else {
                    // Default: LMS portal
                    if (userType === 'lecturer') {
                        window.location.href = 'lecturer-dashboard.html';
                    } else if (userType === 'student') {
                        window.location.href = 'student-dashboard.html';
                    }
                }
            }, 100);
        }
    } else {
        // Priority 1: Account Lockout - Track failed login attempts
        const failedAttemptsKey = `failedAttempts_${username}`;
        const failedAttempts = parseInt(localStorage.getItem(failedAttemptsKey) || '0');
        const newFailedAttempts = failedAttempts + 1;
        localStorage.setItem(failedAttemptsKey, newFailedAttempts.toString());
        
        // Lock account after 5 failed attempts for 30 minutes
        if (newFailedAttempts >= 5) {
            const lockoutUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
            localStorage.setItem(lockoutKey, JSON.stringify({
                lockedUntil: lockoutUntil,
                lockedAt: Date.now(),
                failedAttempts: newFailedAttempts
            }));
            errorMessage.textContent = 'Too many failed login attempts. Account locked for 30 minutes for security.';
            errorMessage.classList.add('show');
            
            // Log account lockout
            if (typeof logAuditAction === 'function') {
                logAuditAction('account_locked', 'user', null, false, 'Account locked after 5 failed attempts', { username: username, attempts: newFailedAttempts });
            }
        } else {
            const attemptsRemaining = 5 - newFailedAttempts;
            errorMessage.textContent = `Invalid username, password, or role. ${attemptsRemaining} attempt(s) remaining before account lockout.`;
            errorMessage.classList.add('show');
        }
        
        // Log failed login attempt
        if (typeof logAuditAction === 'function') {
            logAuditAction('login_attempt', null, null, false, 'Invalid credentials', { username: username, attempts: newFailedAttempts });
        }
    }
}

// Priority 1: Audit Logging Function
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
        metadata: metadata,
        ip_address: null, // Could be added if IP tracking is needed
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
    };
    
    // Try to log to Supabase if available
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from('audit_logs')
                .insert(logData);
            
            if (error) {
                console.error('Failed to log audit action to Supabase:', error);
                // Fallback to localStorage
                const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
                logs.push(logData);
                // Keep only last 100 logs to prevent storage bloat
                localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-100)));
            }
        } catch (err) {
            console.error('Failed to log audit action:', err);
            // Fallback to localStorage
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            logs.push(logData);
            localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-100)));
        }
    } else {
        // Fallback to localStorage if Supabase not available
        const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        logs.push(logData);
        localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-100)));
    }
}

// Make logAuditAction globally available
window.logAuditAction = logAuditAction;
