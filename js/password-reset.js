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
    document.getElementById('emailResetStatus').innerHTML = '';
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

// Email-based password reset
async function handleEmailReset() {
    const email = document.getElementById('resetEmail').value.trim();
    const role = document.getElementById('resetEmailRole').value;
    const statusDiv = document.getElementById('emailResetStatus');
    
    // Clear previous status
    statusDiv.innerHTML = '';
    
    // Validate inputs
    if (!email || !role) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Please fill in all fields</div>';
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Please enter a valid email address</div>';
        return;
    }
    
    // Find user by email
    let user = null;
    
    // Try Supabase
    if (typeof getUserByEmailFromSupabase === 'function') {
        try {
            user = await getUserByEmailFromSupabase(email, role);
        } catch (err) {
            console.error('Supabase email lookup error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!user) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        user = users.find(u => 
            u.email && u.email.toLowerCase() === email.toLowerCase() && 
            u.role === role
        );
    }
    
    if (!user) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">No account found with this email and role. Please check your email address.</div>';
        return;
    }
    
    // Generate 6-digit PIN
    const resetPIN = generateResetPIN();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store PIN temporarily (in production, store in database)
    const resetPINs = JSON.parse(localStorage.getItem('resetPINs') || '{}');
    resetPINs[resetPIN] = {
        userId: user.id,
        email: email,
        role: role,
        username: user.username,
        expiry: resetExpiry.toISOString(),
        used: false
    };
    localStorage.setItem('resetPINs', JSON.stringify(resetPINs));
    
    // Try to send email via EmailJS
    let emailSent = false;
    if (typeof sendResetEmail === 'function') {
        try {
            emailSent = await sendResetEmail(email, user.name, resetPIN);
        } catch (err) {
            console.error('Email sending error:', err);
        }
    }
    
    if (emailSent) {
        // Email sent successfully
        statusDiv.innerHTML = `
            <div style="background: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
                <h4 style="margin-top: 0; color: #155724;">✓ Reset PIN Sent!</h4>
                <p style="color: #155724; margin-bottom: 15px;">
                    We've sent a 6-digit PIN to <strong>${email}</strong>
                </p>
                <p style="color: #155724; font-size: 14px;">
                    Please check your email and enter the PIN below to reset your password.
                </p>
                <div id="pinVerificationSection" style="margin-top: 20px;">
                    <div class="form-group">
                        <label for="resetPIN">Enter 6-Digit PIN</label>
                        <input type="text" id="resetPIN" name="pin" placeholder="000000" maxlength="6" style="text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        <small style="color: #666; font-size: 12px;">PIN expires in 1 hour</small>
                    </div>
                    <div class="form-group">
                        <label for="newPasswordWithPIN">New Password</label>
                        <input type="password" id="newPasswordWithPIN" name="newPassword" placeholder="Enter new password (min 6 characters)">
                    </div>
                    <div class="form-group">
                        <label for="confirmPasswordWithPIN">Confirm New Password</label>
                        <input type="password" id="confirmPasswordWithPIN" name="confirmPassword" placeholder="Re-enter new password">
                    </div>
                    <button type="button" class="btn btn-success" onclick="verifyPINAndReset()">Verify PIN & Reset Password</button>
                    <button type="button" class="btn btn-secondary" onclick="resendPIN()" style="margin-left: 10px;">Resend PIN</button>
                </div>
            </div>
        `;
    } else {
        // Email not sent - show PIN on screen (for demo/testing)
        statusDiv.innerHTML = `
            <div style="background: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
                <h4 style="margin-top: 0; color: #856404;">⚠️ Email Service Not Configured</h4>
                <p style="color: #856404; margin-bottom: 15px;">
                    <strong>Your Reset PIN:</strong>
                </p>
                <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 15px 0;">
                    <div style="font-size: 48px; font-weight: bold; color: var(--primary-color); letter-spacing: 10px;">
                        ${resetPIN}
                    </div>
                </div>
                <p style="color: #856404; font-size: 14px; margin-bottom: 15px;">
                    <strong>Note:</strong> In production, this PIN would be sent to ${email}. 
                    For now, use the PIN above to reset your password.
                </p>
                <div id="pinVerificationSection" style="margin-top: 20px;">
                    <div class="form-group">
                        <label for="resetPIN">Enter 6-Digit PIN</label>
                        <input type="text" id="resetPIN" name="pin" placeholder="000000" maxlength="6" style="text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        <small style="color: #666; font-size: 12px;">PIN expires in 1 hour</small>
                    </div>
                    <div class="form-group">
                        <label for="newPasswordWithPIN">New Password</label>
                        <input type="password" id="newPasswordWithPIN" name="newPassword" placeholder="Enter new password (min 6 characters)">
                    </div>
                    <div class="form-group">
                        <label for="confirmPasswordWithPIN">Confirm New Password</label>
                        <input type="password" id="confirmPasswordWithPIN" name="confirmPassword" placeholder="Re-enter new password">
                    </div>
                    <button type="button" class="btn btn-success" onclick="verifyPINAndReset()">Verify PIN & Reset Password</button>
                </div>
            </div>
        `;
    }
}

// Generate simple reset token (in production, use crypto.randomBytes or similar)
function generateResetToken() {
    return 'reset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// Generate 6-digit PIN
function generateResetPIN() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verify PIN and reset password
async function verifyPINAndReset() {
    const pin = document.getElementById('resetPIN').value.trim();
    const newPassword = document.getElementById('newPasswordWithPIN').value;
    const confirmPassword = document.getElementById('confirmPasswordWithPIN').value;
    const statusDiv = document.getElementById('emailResetStatus');
    
    // Validate PIN
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Please enter a valid 6-digit PIN</div>';
        return;
    }
    
    // Validate password
    if (!newPassword || newPassword.length < 6) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Password must be at least 6 characters long</div>';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Passwords do not match</div>';
        return;
    }
    
    // Check PIN from storage
    const resetPINs = JSON.parse(localStorage.getItem('resetPINs') || '{}');
    const pinData = resetPINs[pin];
    
    if (!pinData) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Invalid PIN. Please check and try again.</div>';
        return;
    }
    
    // Check if PIN expired
    if (new Date(pinData.expiry) < new Date()) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">PIN has expired. Please request a new one.</div>';
        delete resetPINs[pin];
        localStorage.setItem('resetPINs', JSON.stringify(resetPINs));
        return;
    }
    
    // Check if PIN already used
    if (pinData.used) {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">This PIN has already been used. Please request a new one.</div>';
        return;
    }
    
    // Update password
    let passwordUpdated = false;
    
    // Try Supabase first
    if (typeof updateUserPasswordInSupabase === 'function') {
        try {
            passwordUpdated = await updateUserPasswordInSupabase(pinData.userId, newPassword);
        } catch (err) {
            console.error('Supabase password update error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!passwordUpdated) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === pinData.userId);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            passwordUpdated = true;
        }
    }
    
    if (passwordUpdated) {
        // Mark PIN as used
        pinData.used = true;
        resetPINs[pin] = pinData;
        localStorage.setItem('resetPINs', JSON.stringify(resetPINs));
        
        // Show success
        statusDiv.innerHTML = `
            <div style="background: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
                <h4 style="margin-top: 0; color: #155724;">✓ Password Reset Successful!</h4>
                <p style="color: #155724;">Your password has been updated. You can now login with your new password.</p>
                <button onclick="showLoginForm()" class="btn btn-success" style="margin-top: 15px;">Go to Login</button>
            </div>
        `;
    } else {
        statusDiv.innerHTML = '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 5px;">Failed to update password. Please try again.</div>';
    }
}

// Resend PIN
async function resendPIN() {
    const email = document.getElementById('resetEmail').value.trim();
    const role = document.getElementById('resetEmailRole').value;
    
    if (!email || !role) {
        alert('Please enter your email and role first');
        return;
    }
    
    // Regenerate and resend
    await handleEmailReset();
}

// Send reset email via EmailJS (if configured)
async function sendResetEmail(email, name, pin) {
    // Check if EmailJS is configured
    if (typeof emailjs === 'undefined' || !window.EMAILJS_CONFIG) {
        console.warn('EmailJS not configured');
        return false;
    }
    
    try {
        const result = await emailjs.send(
            window.EMAILJS_CONFIG.SERVICE_ID,
            window.EMAILJS_CONFIG.TEMPLATE_ID,
            {
                to_email: email,
                to_name: name,
                pin: pin,
                from_name: 'Signal Training School LMS'
            },
            window.EMAILJS_CONFIG.PUBLIC_KEY
        );
        
        console.log('Email sent successfully:', result);
        return true;
    } catch (err) {
        console.error('Email sending failed:', err);
        return false;
    }
}

// Helper function to get user by email
async function getUserByEmailFromSupabase(email, role) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    try {
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('role', role)
            .maybeSingle();
        
        if (error || !data) return null;
        
        return {
            id: data.id,
            username: data.username,
            password: data.password,
            role: data.role,
            name: data.name,
            email: data.email,
            class: data.class,
            courses: data.courses || []
        };
    } catch (err) {
        console.error('Error getting user by email:', err);
        return null;
    }
}

// Make functions globally accessible
window.showForgotPasswordForm = showForgotPasswordForm;
window.handleEmailReset = handleEmailReset;
window.verifyPINAndReset = verifyPINAndReset;
window.resendPIN = resendPIN;

