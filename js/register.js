// Registration functionality
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Always attach event listener to class dropdown for course updates
    const regClass = document.getElementById('regClass');
    if (regClass) {
        // Remove any existing listeners to prevent duplicates
        const newRegClass = regClass.cloneNode(true);
        regClass.parentNode.replaceChild(newRegClass, regClass);
        
        // Add the event listener
        document.getElementById('regClass').addEventListener('change', updateCoursesForClass);
    }
});

function showRegisterForm(role) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.register-section').style.display = 'none';
    
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
        
        // Ensure event listener is attached (it should already be from DOMContentLoaded, but ensure it's there)
        // The event listener is already attached in DOMContentLoaded, so this is just a safety check
        if (!regClass.hasAttribute('data-listener-attached')) {
            regClass.addEventListener('change', updateCoursesForClass);
            regClass.setAttribute('data-listener-attached', 'true');
        }
    }
    
    // Reset form
    document.getElementById('registerForm').reset();
    
    // Reset course dropdown
    const courseSelect = document.getElementById('regCourse');
    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">Skip - Register later</option>';
    }
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
    console.log('Selected class:', classSelect);
    console.log('Available courses:', courses);
    console.log('Telecom in courses?', courses.includes('Telecom'));
    
    courseSelect.innerHTML = '<option value="">Skip - Register later</option>' +
        courses.map(course => `<option value="${course}">${course}</option>`).join('');
    
    // Log the final HTML to verify Telecom is included
    console.log('Course dropdown HTML includes Telecom?', courseSelect.innerHTML.includes('Telecom'));
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelector('.register-section').style.display = 'block';
    
    // Clear registration form
    document.getElementById('registerForm').reset();
    const errorMsg = document.getElementById('registerErrorMessage');
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Validate CSRF token
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        if (!SecurityUtils.validateFormCSRFToken(form)) {
            const errorMessage = document.getElementById('registerErrorMessage');
            if (errorMessage) {
                errorMessage.textContent = 'Security token validation failed. Please refresh the page and try again.';
                errorMessage.classList.add('show');
            }
            return;
        }
    }
    
    // Get and sanitize inputs
    const rawName = document.getElementById('regName').value;
    const rawUsername = document.getElementById('regUsername').value;
    const rawEmail = document.getElementById('regEmail').value;
    
    const name = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawName.trim()) : rawName.trim();
    const username = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawUsername.trim()) : rawUsername.trim();
    const email = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawEmail.trim()) : rawEmail.trim();
    
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const classSelect = document.getElementById('regClass').value;
    const course = document.getElementById('regCourse').value;
    const errorMessage = document.getElementById('registerErrorMessage');
    let role = document.getElementById('registerForm').dataset.role || 'student';
    
    // Validate and normalize role (ensure it's either 'lecturer' or 'student')
    if (role !== 'lecturer' && role !== 'student') {
        role = 'student'; // Default to student if invalid
    }
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs based on role
    if (!name || !username || !email || !password || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all required fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate name length
    if (name.length < 2 || name.length > 100) {
        errorMessage.textContent = 'Name must be between 2 and 100 characters';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate email format using security utils
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateEmail) {
        if (!SecurityUtils.validateEmail(email)) {
            errorMessage.textContent = 'Please enter a valid email address';
            errorMessage.classList.add('show');
            return;
        }
    } else {
        // Fallback validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorMessage.textContent = 'Please enter a valid email address';
            errorMessage.classList.add('show');
            return;
        }
    }
    
    // Students need class, lecturers don't
    if (role === 'student' && !classSelect) {
        errorMessage.textContent = 'Please select a class';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate password strength using security utils
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validatePasswordStrength) {
        const passwordValidation = SecurityUtils.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            errorMessage.textContent = passwordValidation.reasons.join('. ') + '.';
            errorMessage.classList.add('show');
            return;
        }
    } else {
        // Fallback validation
        if (password.length < 8) {
            errorMessage.textContent = 'Password must be at least 8 characters long';
            errorMessage.classList.add('show');
            return;
        }
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate username format using security utils
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateUsername) {
        if (!SecurityUtils.validateUsername(username)) {
            errorMessage.textContent = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
            errorMessage.classList.add('show');
            return;
        }
    } else {
        // Fallback validation
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            errorMessage.textContent = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
            errorMessage.classList.add('show');
            return;
        }
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
    const roleText = role === 'lecturer' ? 'Lecturer' : 'Student';
    if (typeof showSuccess === 'function') {
        showSuccess(`${roleText} registration successful! Redirecting to your dashboard...`, 'Registration Successful');
        // Redirect after a short delay to show the modal
        setTimeout(() => {
            if (role === 'lecturer') {
                window.location.href = 'lecturer-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }
        }, 1500);
        return;
    } else {
        alert(`${roleText} registration successful! Redirecting to your dashboard...`);
    }
    
    // Redirect to appropriate dashboard based on role
    if (role === 'lecturer') {
        window.location.href = 'lecturer-dashboard.html';
    } else {
        window.location.href = 'student-dashboard.html';
    }
}

