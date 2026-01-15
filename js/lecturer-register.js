// Lecturer Registration - Restricted Access

// Registration code - CHANGE THIS TO A SECURE CODE
// In production, this should be stored securely or generated per lecturer
const LECTURER_REGISTRATION_CODE = 'LECTURER2026'; // Change this!

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('lecturerRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleLecturerRegistration);
    }
});

async function handleLecturerRegistration(e) {
    e.preventDefault();
    
    const form = e.target;
    const errorMessage = document.getElementById('registerErrorMessage');
    
    // Validate CSRF token
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        if (typeof SecurityUtils.addCSRFTokenToForm === 'function') {
            SecurityUtils.addCSRFTokenToForm(form);
        }
        
        if (!SecurityUtils.validateFormCSRFToken(form)) {
            errorMessage.textContent = 'Security token validation failed. Please refresh the page and try again.';
            errorMessage.classList.add('show');
            return;
        }
    }
    
    // Get registration code
    const registrationCode = document.getElementById('registrationCode').value.trim().toUpperCase();
    
    // Validate registration code
    if (registrationCode !== LECTURER_REGISTRATION_CODE) {
        errorMessage.textContent = 'Invalid registration code. Please contact administration for the correct code.';
        errorMessage.classList.add('show');
        return;
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
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    // Validate inputs
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
    
    // Validate email format
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateEmail) {
        if (!SecurityUtils.validateEmail(email)) {
            errorMessage.textContent = 'Please enter a valid email address';
            errorMessage.classList.add('show');
            return;
        }
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorMessage.textContent = 'Please enter a valid email address';
            errorMessage.classList.add('show');
            return;
        }
    }
    
    // Validate password strength
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validatePasswordStrength) {
        const passwordValidation = SecurityUtils.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            errorMessage.textContent = passwordValidation.reasons.join('. ') + '.';
            errorMessage.classList.add('show');
            return;
        }
    } else {
        if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long';
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
    
    // Check if username already exists
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            errorMessage.textContent = 'Database connection error. Please try again.';
            errorMessage.classList.add('show');
            return;
        }
        
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();
        
        if (existingUser) {
            errorMessage.textContent = 'Username or email already exists. Please choose a different one.';
            errorMessage.classList.add('show');
            return;
        }
        
        // Hash password
        let hashedPassword;
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.hashPassword) {
            hashedPassword = await SecurityUtils.hashPassword(password);
        } else {
            // Fallback to CryptoJS if available
            const CryptoJS = window.CryptoJS;
            if (CryptoJS) {
                hashedPassword = CryptoJS.SHA256(password).toString();
            } else {
                errorMessage.textContent = 'Password hashing not available. Please refresh the page.';
                errorMessage.classList.add('show');
                return;
            }
        }
        
        // Create lecturer account
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                name: name,
                username: username,
                email: email,
                password: hashedPassword,
                role: 'lecturer',
                courses: [],
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (createError) {
            console.error('Registration error:', createError);
            errorMessage.textContent = 'Registration failed. Please try again.';
            errorMessage.classList.add('show');
            return;
        }
        
        // Success - show message and redirect to lecturer login page
        if (typeof showSuccess === 'function') {
            showSuccess('Registration successful! Redirecting to lecturer login page...', 'Registration Successful');
        } else {
            alert('Registration successful! Redirecting to lecturer login page...');
        }
        
        // Redirect to lecturer login page after 2 seconds
        setTimeout(() => {
            window.location.href = 'lecturer-login.html?registered=true';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        errorMessage.textContent = 'An error occurred during registration. Please try again.';
        errorMessage.classList.add('show');
    }
}
