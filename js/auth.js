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
    
    // Sanitize inputs
    const username = usernameInput ? SecurityUtils ? SecurityUtils.sanitizeInput(usernameInput.value) : usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const userType = userTypeInput ? userTypeInput.value : '';
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs
    if (!username || !password || !userType) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Rate limiting check
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.checkRateLimit) {
        const rateLimitKey = `login_${username}`;
        const rateLimit = SecurityUtils.checkRateLimit(rateLimitKey, 5, 15); // 5 attempts per 15 minutes
        
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
            user = await getUserFromSupabase(username, password, userType);
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
        
        // Check for portal selection
        const portalType = document.getElementById('portalType')?.value || 'lms';
        
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
        
        console.log('Login - Portal type:', portalType);
        console.log('Login - Redirect parameter:', redirectTo);
        console.log('Login - User role:', userType);
        
        // If redirect parameter exists and is valid, use it
        if (redirectTo && (redirectTo.includes('exam-portal') || redirectTo.includes('lecturer-dashboard') || redirectTo.includes('student-dashboard'))) {
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
        errorMessage.textContent = 'Invalid username, password, or role';
        errorMessage.classList.add('show');
    }
}

