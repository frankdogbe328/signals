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
    const title = role === 'lecturer' ? 'Lecturer Registration' : 'Student Registration';
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
        // Students need class
        classGroup.style.display = 'block';
        courseGroup.style.display = 'block';
        regClass.setAttribute('required', 'required');
        
        // Add event listener for class change to update courses
        regClass.addEventListener('change', updateCoursesForClass);
    }
    
    // Reset form
    document.getElementById('registerForm').reset();
}

// Update courses dropdown based on selected class
function updateCoursesForClass() {
    const classSelect = document.getElementById('regClass').value;
    const courseSelect = document.getElementById('regCourse');
    
    if (!classSelect) {
        courseSelect.innerHTML = '<option value="">Skip - Register later</option>';
        return;
    }
    
    const courses = getCoursesForClass(classSelect);
    courseSelect.innerHTML = '<option value="">Skip - Register later</option>' +
        courses.map(course => `<option value="${course}">${course}</option>`).join('');
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

async function handleRegistration(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const classSelect = document.getElementById('regClass').value;
    const course = document.getElementById('regCourse').value;
    const errorMessage = document.getElementById('registerErrorMessage');
    const role = document.getElementById('registerForm').dataset.role || 'student';
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs based on role
    if (!name || !username || !email || !password || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all required fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        errorMessage.classList.add('show');
        return;
    }
    
    // Students need class, lecturers don't
    if (role === 'student' && !classSelect) {
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
    
    // Check if username already exists (try Supabase first, fallback to localStorage)
    let usernameExists = false;
    
    if (typeof checkUsernameExists === 'function') {
        try {
            usernameExists = await checkUsernameExists(username);
        } catch (err) {
            console.error('Supabase check error:', err);
        }
    }
    
    // Fallback to localStorage check
    if (!usernameExists) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    }
    
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
            username: username,
            password: password,
            role: 'lecturer',
            name: name,
            email: email
        };
    } else {
        // Create student account
        newUser = {
            username: username,
            password: password,
            role: 'student',
            name: name,
            email: email,
            class: classSelect,
            courses: course ? [course] : [] // Store as array for multiple courses (can be empty)
        };
    }
    
    // Try Supabase first - REQUIRED for cross-device access
    let createdUser = null;
    let supabaseError = null;
    
    if (typeof createUserInSupabase === 'function') {
        try {
            createdUser = await createUserInSupabase(newUser);
            if (!createdUser) {
                supabaseError = 'Failed to create user in Supabase';
            }
        } catch (err) {
            console.error('Supabase registration error:', err);
            supabaseError = err.message || 'Supabase error';
        }
    } else {
        supabaseError = 'Supabase functions not available';
    }
    
    // If Supabase failed, show error - don't silently fallback to localStorage
    // This ensures users are saved to Supabase for cross-device access
    if (!createdUser) {
        errorMessage.textContent = `Registration failed: ${supabaseError || 'Unable to connect to database. Please check your connection and try again.'}`;
        errorMessage.classList.add('show');
        console.error('Registration failed - user not saved to Supabase:', supabaseError);
        return; // Don't continue if Supabase save failed
    }
    
    // Also save to localStorage as backup (but Supabase is primary)
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        // Remove old entry if exists
        const existingIndex = users.findIndex(u => u.username === createdUser.username);
        if (existingIndex !== -1) {
            users[existingIndex] = createdUser;
        } else {
            users.push(createdUser);
        }
        localStorage.setItem('users', JSON.stringify(users));
    } catch (err) {
        console.warn('Failed to save to localStorage backup:', err);
        // Don't fail registration if localStorage backup fails
    }
    
    // Automatically log in the newly registered user
    setCurrentUser(createdUser);
    
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

