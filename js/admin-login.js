// Admin Login - Dedicated Admin Login Handler

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
});

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const errorMessage = document.getElementById('adminErrorMessage');
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    // Clear previous errors
    if (errorMessage) {
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
    }
    
    // Validate inputs
    if (!username || !password) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter both username and password';
            errorMessage.classList.add('show');
        }
        return;
    }
    
    // Validate CSRF token if available
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.addCSRFTokenToForm) {
        SecurityUtils.addCSRFTokenToForm(form);
    }
    
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        const isValid = SecurityUtils.validateFormCSRFToken(form);
        if (!isValid) {
            if (errorMessage) {
                errorMessage.textContent = 'Security token validation failed. Please refresh the page and try again.';
                errorMessage.classList.add('show');
            }
            return;
        }
    }
    
    // Rate limiting check
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.checkRateLimit) {
        const rateLimitKey = `admin_login_${username}`;
        const rateLimit = SecurityUtils.checkRateLimit(rateLimitKey, 5, 3); // 5 attempts per 3 minutes
        
        if (!rateLimit.allowed) {
            if (errorMessage) {
                errorMessage.textContent = `Too many login attempts. Please try again in ${rateLimit.timeRemaining} minutes.`;
                errorMessage.classList.add('show');
            }
            return;
        }
    }
    
    // Try Supabase first, fallback to localStorage for backward compatibility
    let user = null;
    
    // Check if Supabase is available
    if (typeof getUserFromSupabase === 'function') {
        try {
            // Force admin role check
            user = await getUserFromSupabase(username, password, 'admin');
            
            // Verify the user is actually an admin
            if (user && user.role !== 'admin') {
                console.warn('User is not an admin:', user.role);
                user = null;
                if (errorMessage) {
                    errorMessage.textContent = 'Invalid credentials for admin access.';
                    errorMessage.classList.add('show');
                }
                return;
            }
        } catch (err) {
            console.error('Supabase login error:', err);
            if (errorMessage) {
                errorMessage.textContent = 'Login failed. Please try again.';
                errorMessage.classList.add('show');
            }
            return;
        }
    }
    
    // Fallback to localStorage if Supabase fails or not available (for migration)
    if (!user && typeof localStorage !== 'undefined') {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const potentialUser = users.find(u => u.username === username && u.role === 'admin');
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
    
    if (user && user.role === 'admin') {
        // Clear rate limit on successful login
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearRateLimit) {
            SecurityUtils.clearRateLimit(`admin_login_${username}`);
        }
        
        // Set secure session
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.setSecureSession) {
            SecurityUtils.setSecureSession(user, 480); // 8 hour session
        }
        
        // Set current user (legacy support)
        setCurrentUser(user);
        
        // Redirect directly to admin portal
        setTimeout(() => {
            window.location.href = 'admin-portal.html';
        }, 100);
    } else {
        if (errorMessage) {
            errorMessage.textContent = 'Invalid username, password, or you do not have admin access.';
            errorMessage.classList.add('show');
        }
    }
}
