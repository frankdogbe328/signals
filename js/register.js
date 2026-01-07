// Registration functionality
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
});

function showRegisterForm(role) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.register-section').style.display = 'none';
    document.querySelector('.demo-credentials').style.display = 'none';
    
    // Store registration role
    document.getElementById('registerForm').dataset.role = role;
    
    // Update form title
    const title = role === 'lecturer' ? 'Lecturer Registration' : 'Officer Registration';
    document.getElementById('registerTitle').textContent = title;
    
    // Show/hide fields based on role
    const classGroup = document.getElementById('regClassGroup');
    const courseGroup = document.getElementById('regCourseGroup');
    const regClass = document.getElementById('regClass');
    
    if (role === 'lecturer') {
        // Lecturers don't need class or course
        classGroup.style.display = 'none';
        courseGroup.style.display = 'none';
        regClass.removeAttribute('required');
    } else {
        // Officers need class
        classGroup.style.display = 'block';
        courseGroup.style.display = 'block';
        regClass.setAttribute('required', 'required');
    }
    
    // Reset form
    document.getElementById('registerForm').reset();
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelector('.register-section').style.display = 'block';
    document.querySelector('.demo-credentials').style.display = 'block';
    
    // Clear registration form
    document.getElementById('registerForm').reset();
    const errorMsg = document.getElementById('registerErrorMessage');
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
}

function handleRegistration(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const classSelect = document.getElementById('regClass').value;
    const course = document.getElementById('regCourse').value;
    const errorMessage = document.getElementById('registerErrorMessage');
    const role = document.getElementById('registerForm').dataset.role || 'officer';
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs based on role
    if (!name || !username || !password || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all required fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Officers need class, lecturers don't
    if (role === 'officer' && !classSelect) {
        errorMessage.textContent = 'Please select a class';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters long';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate username format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errorMessage.textContent = 'Username can only contain letters, numbers, and underscores';
        errorMessage.classList.add('show');
        return;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (usernameExists) {
        errorMessage.textContent = 'Username already exists. Please choose a different username.';
        errorMessage.classList.add('show');
        return;
    }
    
    // Create new account based on role
    let newUser;
    
    if (role === 'lecturer') {
        // Create lecturer account
        newUser = {
            id: 'lecturer_' + Date.now().toString(),
            username: username,
            password: password,
            role: 'lecturer',
            name: name
        };
    } else {
        // Create officer account
        // Store courses as an array to support multiple course registrations
        newUser = {
            id: 'officer_' + Date.now().toString(),
            username: username,
            password: password,
            role: 'officer',
            name: name,
            class: classSelect,
            courses: course ? [course] : [] // Store as array for multiple courses (can be empty)
        };
    }
    
    // Add to users array
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Automatically log in the newly registered user
    setCurrentUser(newUser);
    
    // Show success message
    const roleText = role === 'lecturer' ? 'Lecturer' : 'Officer';
    alert(`${roleText} registration successful! Redirecting to your dashboard...`);
    
    // Redirect to appropriate dashboard based on role
    if (role === 'lecturer') {
        window.location.href = 'lecturer-dashboard.html';
    } else {
        window.location.href = 'officer-dashboard.html';
    }
}

