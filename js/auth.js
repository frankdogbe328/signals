// Authentication handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function handleLogin(e) {
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
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === userType
    );
    
    if (user) {
        // Set current user
        setCurrentUser(user);
        
        // Redirect based on role
        if (userType === 'lecturer') {
            window.location.href = 'lecturer-dashboard.html';
        } else if (userType === 'officer') {
            window.location.href = 'officer-dashboard.html';
        }
    } else {
        errorMessage.textContent = 'Invalid username, password, or role';
        errorMessage.classList.add('show');
    }
}

