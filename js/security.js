// Security Utilities Module
// Comprehensive security functions for the LMS/Exam Portal system

// ========== PASSWORD SECURITY ==========

/**
 * Hash password using Web Crypto API (SHA-256)
 * Note: For production, use bcrypt or Argon2 server-side
 * This is a client-side implementation that should be enhanced with server-side hashing
 */
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Password hashing error:', error);
        throw new Error('Failed to hash password');
    }
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
    try {
        const passwordHash = await hashPassword(password);
        return passwordHash === hash;
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

// ========== INPUT SANITIZATION & XSS PREVENTION ==========

/**
 * Escape HTML to prevent XSS attacks
 * Enhanced version that handles more edge cases
 */
function escapeHtml(text) {
    if (text == null) return '';
    if (typeof text !== 'string') text = String(text);
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'`=\/]/g, s => map[s]);
}

/**
 * Sanitize user input - removes potentially dangerous characters and scripts
 */
function sanitizeInput(input) {
    if (input == null) return '';
    if (typeof input !== 'string') input = String(input);
    
    // Remove script tags and event handlers
    let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length to prevent DoS
    const MAX_LENGTH = 10000;
    if (sanitized.length > MAX_LENGTH) {
        sanitized = sanitized.substring(0, MAX_LENGTH);
    }
    
    return sanitized;
}

/**
 * Sanitize and escape HTML for safe display
 */
function sanitizeAndEscapeHtml(text) {
    return escapeHtml(sanitizeInput(text));
}

/**
 * Safe innerHTML replacement - sanitizes before setting
 */
function setSafeInnerHTML(element, html) {
    if (!element) return;
    
    // Sanitize the HTML content
    const sanitized = sanitizeInput(html);
    const escaped = escapeHtml(sanitized);
    
    // Use textContent for simple text, or create safe HTML structure
    if (!sanitized.includes('<')) {
        element.textContent = sanitized;
    } else {
        // For HTML content, parse and sanitize each node
        const tempDiv = document.createElement('div');
        tempDiv.textContent = sanitized; // This escapes all HTML
        element.innerHTML = tempDiv.innerHTML;
        
        // If we need actual HTML structure, use DOMPurify library
        // For now, we'll escape everything for safety
        element.textContent = sanitized;
    }
}

/**
 * Validate email format
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validate username format (alphanumeric, underscore, 3-20 chars)
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string') return false;
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username.trim());
}

/**
 * Validate password strength
 * Returns object with isValid and reasons array
 */
function validatePasswordStrength(password) {
    const reasons = [];
    
    if (!password || password.length < 8) {
        reasons.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
        reasons.push('Password must be less than 128 characters');
    }
    if (!/[a-z]/.test(password)) {
        reasons.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        reasons.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        reasons.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        reasons.push('Password must contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
        reasons.push('Password is too common. Please choose a stronger password');
    }
    
    return {
        isValid: reasons.length === 0,
        reasons: reasons
    };
}

// ========== RATE LIMITING ==========

/**
 * Rate limiting for login attempts
 * Uses localStorage to track attempts (for client-side, should be server-side in production)
 */
function checkRateLimit(key, maxAttempts = 5, windowMinutes = 15) {
    const storageKey = `rateLimit_${key}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    try {
        const stored = localStorage.getItem(storageKey);
        let attempts = stored ? JSON.parse(stored) : [];
        
        // Remove attempts outside the time window
        attempts = attempts.filter(timestamp => now - timestamp < windowMs);
        
        if (attempts.length >= maxAttempts) {
            const oldestAttempt = attempts[0];
            const timeRemaining = Math.ceil((windowMs - (now - oldestAttempt)) / 1000 / 60);
            return {
                allowed: false,
                timeRemaining: timeRemaining,
                attemptsRemaining: 0
            };
        }
        
        // Add current attempt
        attempts.push(now);
        localStorage.setItem(storageKey, JSON.stringify(attempts));
        
        return {
            allowed: true,
            attemptsRemaining: maxAttempts - attempts.length,
            timeRemaining: 0
        };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request (fail open for availability)
        return { allowed: true, attemptsRemaining: maxAttempts, timeRemaining: 0 };
    }
}

/**
 * Clear rate limit for a key (e.g., on successful login)
 */
function clearRateLimit(key) {
    const storageKey = `rateLimit_${key}`;
    try {
        localStorage.removeItem(storageKey);
    } catch (error) {
        console.error('Rate limit clear error:', error);
    }
}

// ========== SESSION MANAGEMENT ==========

/**
 * Create secure session token
 */
function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set session with expiration
 */
function setSecureSession(userData, expirationMinutes = 480) { // 8 hours default
    try {
        const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
        const sessionData = {
            user: userData,
            token: generateSessionToken(),
            expiresAt: expirationTime,
            createdAt: Date.now()
        };
        
        sessionStorage.setItem('secureSession', JSON.stringify(sessionData));
        return sessionData.token;
    } catch (error) {
        console.error('Session creation error:', error);
        return null;
    }
}

/**
 * Get and validate session
 */
function getSecureSession() {
    try {
        const sessionData = sessionStorage.getItem('secureSession');
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session expired
        if (session.expiresAt && now > session.expiresAt) {
            clearSecureSession();
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Session retrieval error:', error);
        clearSecureSession();
        return null;
    }
}

/**
 * Clear secure session
 */
function clearSecureSession() {
    try {
        sessionStorage.removeItem('secureSession');
        // Also clear legacy session if exists
        sessionStorage.removeItem('currentUser');
    } catch (error) {
        console.error('Session clear error:', error);
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const session = getSecureSession();
    return session !== null && session.user !== null;
}

// ========== CSRF PROTECTION ==========

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    return generateSessionToken(); // Reuse session token generator
}

/**
 * Get or create CSRF token for current session
 */
function getCSRFToken() {
    try {
        let token = sessionStorage.getItem('csrfToken');
        if (!token) {
            token = generateCSRFToken();
            sessionStorage.setItem('csrfToken', token);
        }
        return token;
    } catch (error) {
        console.error('CSRF token generation error:', error);
        return null;
    }
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken(token) {
    try {
        const storedToken = sessionStorage.getItem('csrfToken');
        return storedToken && storedToken === token;
    } catch (error) {
        console.error('CSRF verification error:', error);
        return false;
    }
}

// ========== FILE UPLOAD SECURITY ==========

/**
 * Validate file type
 */
function validateFileType(file, allowedTypes) {
    if (!file || !allowedTypes || !Array.isArray(allowedTypes)) return false;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;
    
    return allowedTypes.some(type => {
        const typeLower = type.toLowerCase();
        return fileExtension === typeLower || mimeType.includes(typeLower);
    });
}

/**
 * Validate file size
 */
function validateFileSize(file, maxSizeMB = 10) {
    if (!file) return false;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Sanitize filename to prevent path traversal and XSS
 */
function sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return 'file';
    
    // Remove path separators and dangerous characters
    let sanitized = filename
        .replace(/[\/\\?%*:|"<>]/g, '')
        .replace(/\.\./g, '')
        .trim();
    
    // Remove leading dots
    sanitized = sanitized.replace(/^\.+/, '');
    
    // Limit length
    if (sanitized.length > 255) {
        const ext = sanitized.split('.').pop();
        sanitized = sanitized.substring(0, 255 - ext.length - 1) + '.' + ext;
    }
    
    // Ensure it's not empty
    if (!sanitized || sanitized.length === 0) {
        sanitized = 'file_' + Date.now();
    }
    
    return sanitized;
}

/**
 * Validate Word document file
 */
function validateWordDocument(file) {
    const allowedTypes = ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSizeMB = 5; // 5MB limit for Word documents
    
    if (!validateFileType(file, allowedTypes)) {
        return { valid: false, error: 'Invalid file type. Only .docx files are allowed.' };
    }
    
    if (!validateFileSize(file, maxSizeMB)) {
        return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
    }
    
    // Check for malicious filename patterns
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { valid: false, error: 'Invalid filename. Filename contains illegal characters.' };
    }
    
    return { valid: true, error: null };
}

// ========== AUTHORIZATION CHECKS ==========

/**
 * Check if user has permission to access resource
 */
function checkPermission(user, resource, action) {
    if (!user || !user.role) return false;
    
    // Lecturers can manage their own resources
    if (user.role === 'lecturer') {
        if (action === 'create' || action === 'read' || action === 'update' || action === 'delete') {
            // Additional checks can be added here (e.g., resource ownership)
            return true;
        }
    }
    
    // Students can only read
    if (user.role === 'student') {
        if (action === 'read') {
            return true;
        }
    }
    
    return false;
}

/**
 * Verify user owns the resource
 */
function verifyResourceOwnership(user, resource, userIdField = 'user_id') {
    if (!user || !resource) return false;
    return resource[userIdField] === user.id || resource.lecturer_id === user.id;
}

// ========== FORM CSRF PROTECTION ==========

/**
 * Add CSRF token to a form
 */
function addCSRFTokenToForm(form) {
    if (!form) return;
    
    // Remove existing CSRF token if any
    const existingToken = form.querySelector('input[name="_csrf_token"]');
    if (existingToken) {
        existingToken.remove();
    }
    
    // Get or generate CSRF token
    const token = getCSRFToken();
    if (!token) return;
    
    // Create hidden input field
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_csrf_token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
}

/**
 * Validate CSRF token from form submission
 */
function validateFormCSRFToken(form) {
    if (!form) return false;
    
    const tokenInput = form.querySelector('input[name="_csrf_token"]');
    if (!tokenInput || !tokenInput.value) {
        return false;
    }
    
    return verifyCSRFToken(tokenInput.value);
}

/**
 * Initialize CSRF protection for all forms on page load
 */
function initializeCSRFProtection() {
    if (typeof document === 'undefined') return;
    
    // Add tokens to all existing forms
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Only add to forms that don't already have a token
            if (!form.querySelector('input[name="_csrf_token"]')) {
                addCSRFTokenToForm(form);
            }
        });
    });
    
    // Also handle dynamically created forms
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'FORM') {
                        addCSRFTokenToForm(node);
                    }
                    // Check for forms within added nodes
                    const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                    forms.forEach(form => {
                        if (!form.querySelector('input[name="_csrf_token"]')) {
                            addCSRFTokenToForm(form);
                        }
                    });
                }
            });
        });
    });
    
    if (typeof document.body !== 'undefined') {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Auto-initialize CSRF protection
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Run immediately if DOM is already loaded, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCSRFProtection);
    } else {
        initializeCSRFProtection();
    }
}

// ========== EXPORT FUNCTIONS ==========
// Make functions available globally for use in other files
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        hashPassword,
        verifyPassword,
        escapeHtml,
        sanitizeInput,
        sanitizeAndEscapeHtml,
        setSafeInnerHTML,
        validateEmail,
        validateUsername,
        validatePasswordStrength,
        checkRateLimit,
        clearRateLimit,
        setSecureSession,
        getSecureSession,
        clearSecureSession,
        isAuthenticated,
        generateCSRFToken,
        getCSRFToken,
        verifyCSRFToken,
        addCSRFTokenToForm,
        validateFormCSRFToken,
        validateFileType,
        validateFileSize,
        sanitizeFilename,
        validateWordDocument,
        checkPermission,
        verifyResourceOwnership
    };
}