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
        
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        // If redirect parameter exists and is valid, use it
        if (redirectTo && (redirectTo.includes('exam-portal') || redirectTo.includes('lecturer-dashboard') || redirectTo.includes('student-dashboard'))) {
            window.location.href = redirectTo;
        } else {
            // Default redirect based on role
            if (userType === 'lecturer') {
                window.location.href = 'lecturer-dashboard.html';
            } else if (userType === 'student') {
                window.location.href = 'student-dashboard.html';
            }
        }
    } else {
        errorMessage.textContent = 'Invalid username, password, or role';
        errorMessage.classList.add('show');
    }
}

