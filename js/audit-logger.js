// Priority 1: Centralized Audit Logging Module
// Provides audit logging for critical operations across the system

/**
 * Log audit action to Supabase (if available) or localStorage (fallback)
 * @param {string} action - The action performed (e.g., 'login', 'upload', 'delete')
 * @param {string|null} resourceType - Type of resource (e.g., 'material', 'user', 'exam')
 * @param {string|null} resourceId - ID of the resource affected
 * @param {boolean} success - Whether the action was successful
 * @param {string|null} errorMessage - Error message if action failed
 * @param {object} metadata - Additional metadata about the action
 */
async function logAuditAction(action, resourceType = null, resourceId = null, success = true, errorMessage = null, metadata = {}) {
    try {
        const currentUser = getCurrentUser ? getCurrentUser() : null;
        
        const logData = {
            user_id: currentUser?.id || null,
            username: currentUser?.username || 'anonymous',
            action: action,
            resource_type: resourceType,
            resource_id: resourceId,
            success: success,
            error_message: errorMessage,
            metadata: metadata,
            ip_address: null, // Could be added if IP tracking is needed
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            timestamp: new Date().toISOString()
        };
        
        // Try to log to Supabase if available
        if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
            try {
                const { error } = await window.supabaseClient
                    .from('audit_logs')
                    .insert(logData);
                
                if (error) {
                    console.warn('Failed to log audit action to Supabase:', error);
                    // Fallback to localStorage
                    fallbackToLocalStorage(logData);
                }
            } catch (err) {
                console.error('Failed to log audit action:', err);
                // Fallback to localStorage
                fallbackToLocalStorage(logData);
            }
        } else {
            // Fallback to localStorage if Supabase not available
            fallbackToLocalStorage(logData);
        }
    } catch (err) {
        console.error('Audit logging error:', err);
        // Silently fail - don't block user operations due to logging failures
    }
}

/**
 * Fallback to localStorage for audit logs
 */
function fallbackToLocalStorage(logData) {
    try {
        if (typeof localStorage !== 'undefined') {
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            logs.push(logData);
            // Keep only last 100 logs to prevent storage bloat
            localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-100)));
        }
    } catch (err) {
        console.error('Failed to store audit log in localStorage:', err);
    }
}

/**
 * Helper functions for common audit actions
 */
const AuditLogger = {
    logLogin: (username, success, errorMessage = null) => {
        return logAuditAction('login', null, null, success, errorMessage, { username: username });
    },
    
    logLogout: (username) => {
        return logAuditAction('logout', null, null, true, null, { username: username });
    },
    
    logMaterialUpload: (materialId, success, errorMessage = null) => {
        return logAuditAction('material_upload', 'material', materialId, success, errorMessage);
    },
    
    logMaterialDelete: (materialId, success, errorMessage = null) => {
        return logAuditAction('material_delete', 'material', materialId, success, errorMessage);
    },
    
    logUserCreate: (userId, success, errorMessage = null) => {
        return logAuditAction('user_create', 'user', userId, success, errorMessage);
    },
    
    logUserDelete: (userId, success, errorMessage = null) => {
        return logAuditAction('user_delete', 'user', userId, success, errorMessage);
    },
    
    logExamCreate: (examId, success, errorMessage = null) => {
        return logAuditAction('exam_create', 'exam', examId, success, errorMessage);
    },
    
    logExamSubmission: (examId, success, errorMessage = null) => {
        return logAuditAction('exam_submission', 'exam', examId, success, errorMessage);
    },
    
    logAccountLockout: (username, attempts) => {
        return logAuditAction('account_locked', 'user', null, false, 'Account locked after 5 failed attempts', { username: username, attempts: attempts });
    },
    
    logPermissionDenied: (action, resourceType, resourceId) => {
        return logAuditAction('permission_denied', resourceType, resourceId, false, 'Access denied', { action: action });
    }
};

// Make functions globally available
if (typeof window !== 'undefined') {
    window.logAuditAction = logAuditAction;
    window.AuditLogger = AuditLogger;
}
