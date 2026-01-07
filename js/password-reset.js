// Password Reset Functionality

function showForgotPasswordForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    
    // Reset form
    document.getElementById('forgotPasswordForm').reset();
    document.getElementById('resetErrorMessage').classList.remove('show');
    document.getElementById('resetErrorMessage').textContent = '';
    document.getElementById('resetSuccessMessage').style.display = 'none';
    
    // Hide all method sections
    document.getElementById('verifyMethod').style.display = 'none';
    document.getElementById('adminMethod').style.display = 'none';
    document.getElementById('manualMethod').style.display = 'none';
    document.getElementById('backToLoginBtn').style.display = 'none';
}

function handleResetMethodChange() {
    const method = document.getElementById('resetMethod').value;
    const verifyMethod = document.getElementById('verifyMethod');
    const adminMethod = document.getElementById('adminMethod');
    const manualMethod = document.getElementById('manualMethod');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    
    // Hide all methods
    verifyMethod.style.display = 'none';
    adminMethod.style.display = 'none';
    manualMethod.style.display = 'none';
    backToLoginBtn.style.display = 'none';
    
    // Show selected method
    if (method === 'verify') {
        verifyMethod.style.display = 'block';
        backToLoginBtn.style.display = 'block';
    } else if (method === 'admin') {
        adminMethod.style.display = 'block';
        backToLoginBtn.style.display = 'block';
    } else if (method === 'manual') {
        manualMethod.style.display = 'block';
        backToLoginBtn.style.display = 'block';
    }
}

async function handlePasswordReset() {
    const username = document.getElementById('resetUsername').value.trim();
    const name = document.getElementById('resetName').value.trim();
    const role = document.getElementById('resetRole').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    const errorMessage = document.getElementById('resetErrorMessage');
    const successMessage = document.getElementById('resetSuccessMessage');
    
    // Clear messages
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    successMessage.style.display = 'none';
    
    // Validate inputs
    if (!username || !name || !role || !newPassword || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters long';
        errorMessage.classList.add('show');
        return;
    }
    
    // Validate password match
    if (newPassword !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.classList.add('show');
        return;
    }
    
    // Try to find user in Supabase first, fallback to localStorage
    let user = null;
    
    // Try Supabase
    if (typeof getUserByUsernameFromSupabase === 'function') {
        try {
            user = await getUserByUsernameFromSupabase(username, role);
        } catch (err) {
            console.error('Supabase user lookup error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!user) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.role === role
        );
    }
    
    // Verify user exists
    if (!user) {
        errorMessage.textContent = 'User not found. Please check your username and role.';
        errorMessage.classList.add('show');
        return;
    }
    
    // Verify name matches (case-insensitive)
    if (user.name.toLowerCase() !== name.toLowerCase()) {
        errorMessage.textContent = 'Full name does not match. Please enter the exact name used during registration.';
        errorMessage.classList.add('show');
        return;
    }
    
    // Update password
    let passwordUpdated = false;
    
    // Try Supabase first
    if (typeof updateUserPasswordInSupabase === 'function') {
        try {
            passwordUpdated = await updateUserPasswordInSupabase(user.id, newPassword);
        } catch (err) {
            console.error('Supabase password update error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!passwordUpdated) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            passwordUpdated = true;
        }
    }
    
    if (passwordUpdated) {
        // Show success message
        successMessage.innerHTML = `
            <strong>✓ Password Reset Successful!</strong><br>
            Your password has been updated. You can now login with your new password.
        `;
        successMessage.style.display = 'block';
        
        // Clear form
        document.getElementById('resetUsername').value = '';
        document.getElementById('resetName').value = '';
        document.getElementById('resetRole').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
            showLoginForm();
        }, 3000);
    } else {
        errorMessage.textContent = 'Failed to update password. Please try again or contact administrator.';
        errorMessage.classList.add('show');
    }
}

// Helper function to get user by username (without password check)
async function getUserByUsernameFromSupabase(username, role) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('role', role)
            .maybeSingle();
        
        if (error || !data) return null;
        
        return {
            id: data.id,
            username: data.username,
            password: data.password,
            role: data.role,
            name: data.name,
            class: data.class,
            courses: data.courses || []
        };
    } catch (err) {
        console.error('Error getting user:', err);
        return null;
    }
}

// Helper function to update password in Supabase
async function updateUserPasswordInSupabase(userId, newPassword) {
    const client = getSupabaseClient();
    if (!client) return false;
    
    try {
        const { data, error } = await client
            .from('users')
            .update({ password: newPassword })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating password:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('Error updating password:', err);
        return false;
    }
}

// Make functions globally accessible
window.showForgotPasswordForm = showForgotPasswordForm;
window.handleResetMethodChange = handleResetMethodChange;
window.handlePasswordReset = handlePasswordReset;

