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
    
    // Ensure Supabase client is initialized
    if (typeof initSupabase === 'function') {
        initSupabase();
    }
    
    // Wait a moment for Supabase to initialize if needed
    if (!window.supabaseClient && typeof window.supabase !== 'undefined') {
        console.log('Waiting for Supabase client initialization...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof initSupabase === 'function') {
            initSupabase();
        }
    }
    
    // Check if Supabase is available
    if (typeof getUserFromSupabase === 'function') {
        try {
            console.log('Attempting admin login for:', username);
            console.log('Supabase client available:', !!window.supabaseClient);
            // Force admin role check
            user = await getUserFromSupabase(username, password, 'admin');
            
            console.log('User lookup result:', user ? 'Found user' : 'No user found');
            
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
            
            if (!user) {
                console.log('Admin user not found. Please verify:');
                console.log('1. SQL script has been run in Supabase');
                console.log('2. Username is exactly: admin');
                console.log('3. Password is exactly: Admin123!');
                console.log('4. Role is set to: admin');
                
                // Try to query database directly to see what's there
                if (window.supabaseClient) {
                    console.log('Attempting to query database for admin users...');
                    try {
                        const { data: adminUsers, error: queryError } = await window.supabaseClient
                            .from('users')
                            .select('username, name, role, email')
                            .eq('role', 'admin')
                            .limit(10);
                        
                        if (queryError) {
                            console.error('Query error:', queryError);
                        } else {
                            console.log('Admin users found in database:', adminUsers);
                            if (adminUsers && adminUsers.length > 0) {
                                console.log('Found', adminUsers.length, 'admin user(s). Check if username matches exactly.');
                            } else {
                                console.error('No admin users found. Run SQL script: lms/verify-and-fix-admin.sql');
                            }
                        }
                    } catch (err) {
                        console.error('Error querying admin users:', err);
                    }
                }
            }
        } catch (err) {
            console.error('Supabase login error:', err);
            if (errorMessage) {
                errorMessage.textContent = 'Login failed: ' + (err.message || 'Database connection error');
                errorMessage.classList.add('show');
            }
            return;
        }
    } else {
        console.error('getUserFromSupabase function not available');
        console.error('Debug info:', {
            supabase: typeof window.supabase,
            supabaseClient: typeof window.supabaseClient,
            SUPABASE_URL: typeof SUPABASE_URL,
            SUPABASE_ANON_KEY: typeof SUPABASE_ANON_KEY,
            getUserFromSupabase: typeof getUserFromSupabase,
            initSupabase: typeof initSupabase
        });
        if (errorMessage) {
            errorMessage.textContent = 'Database connection not available. Please refresh the page and try again.';
            errorMessage.classList.add('show');
        }
        return;
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
