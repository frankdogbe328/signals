// Authentication handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs
    if (!username || !password || !userType) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Try Supabase first, fallback to localStorage for backward compatibility
    let user = null;
    
    // Check if Supabase is available
    if (typeof getUserFromSupabase === 'function') {
        try {
            user = await getUserFromSupabase(username, password, userType);
        } catch (err) {
            console.error('Supabase login error:', err);
        }
    }
    
    // Fallback to localStorage if Supabase fails or not available
    if (!user) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        user = users.find(u => 
            u.username === username && 
            u.password === password && 
            u.role === userType
        );
    }
    
    if (user) {
        // Set current user
        setCurrentUser(user);
        
        // Check for portal selection
        const portalType = document.getElementById('portalType')?.value || 'lms';
        
        // Check for redirect parameter in URL (takes priority)
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
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

