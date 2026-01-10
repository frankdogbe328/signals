// Error Monitoring and Logging
// Supports Sentry integration or custom error tracking

// ========== ERROR MONITORING CONFIGURATION ==========

const ErrorMonitoring = {
    enabled: true,
    dsn: null, // Set your Sentry DSN here if using Sentry
    environment: 'production', // 'development' or 'production'
    
    // Initialize error monitoring
    init: function(config = {}) {
        if (!this.enabled) return;
        
        this.dsn = config.dsn || this.dsn;
        this.environment = config.environment || this.environment || (window.location.hostname === 'localhost' ? 'development' : 'production');
        
        // Initialize Sentry if DSN provided
        if (this.dsn && typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.init({
                dsn: this.dsn,
                environment: this.environment,
                tracesSampleRate: 0.1, // 10% of transactions
                beforeSend(event, hint) {
                    // Filter out sensitive information
                    if (event.request) {
                        // Remove passwords from request data
                        if (event.request.data) {
                            const data = typeof event.request.data === 'string' ? 
                                JSON.parse(event.request.data) : event.request.data;
                            if (data.password) data.password = '[REDACTED]';
                            if (data.confirmPassword) data.confirmPassword = '[REDACTED]';
                            event.request.data = JSON.stringify(data);
                        }
                    }
                    return event;
                }
            });
        }
        
        // Set up global error handlers
        this.setupErrorHandlers();
    },
    
    // Set up global error handlers
    setupErrorHandlers: function() {
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureException(event.reason, {
                tags: { type: 'unhandledrejection' },
                level: 'error'
            });
        });
        
        // Global JavaScript errors
        window.addEventListener('error', (event) => {
            // Filter out common non-critical errors
            if (this.shouldIgnoreError(event.error)) {
                return;
            }
            
            this.captureException(event.error, {
                tags: { type: 'javascript_error' },
                level: 'error',
                extra: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            });
        });
    },
    
    // Check if error should be ignored
    shouldIgnoreError: function(error) {
        if (!error || !error.message) return true;
        
        const ignoredPatterns = [
            'ResizeObserver loop',
            'Non-Error promise rejection',
            'Script error',
            'NetworkError',
            'Failed to fetch' // Often caused by network issues, not code bugs
        ];
        
        return ignoredPatterns.some(pattern => error.message.includes(pattern));
    },
    
    // Capture an exception
    captureException: function(error, options = {}) {
        if (!this.enabled) {
            console.error('Error (monitoring disabled):', error);
            return;
        }
        
        // Log to console in development
        if (this.environment === 'development') {
            console.error('Captured Error:', error, options);
        }
        
        // Send to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry && this.dsn) {
            window.Sentry.captureException(error, {
                level: options.level || 'error',
                tags: options.tags || {},
                extra: options.extra || {}
            });
        }
        
        // Store in local storage for debugging (last 10 errors)
        this.storeErrorLocally(error, options);
    },
    
    // Capture a message
    captureMessage: function(message, options = {}) {
        if (!this.enabled) {
            console.log('Message (monitoring disabled):', message);
            return;
        }
        
        // Log to console in development
        if (this.environment === 'development') {
            console.log('Captured Message:', message, options);
        }
        
        // Send to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry && this.dsn) {
            window.Sentry.captureMessage(message, {
                level: options.level || 'info',
                tags: options.tags || {},
                extra: options.extra || {}
            });
        }
    },
    
    // Store error locally for debugging
    storeErrorLocally: function(error, options) {
        try {
            const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
            const errorEntry = {
                timestamp: new Date().toISOString(),
                message: error?.message || String(error),
                stack: error?.stack,
                tags: options.tags || {},
                extra: options.extra || {},
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            errorLog.unshift(errorEntry);
            
            // Keep only last 10 errors
            if (errorLog.length > 10) {
                errorLog.pop();
            }
            
            localStorage.setItem('errorLog', JSON.stringify(errorLog));
        } catch (e) {
            console.warn('Failed to store error locally:', e);
        }
    },
    
    // Get stored errors (for debugging/admin panel)
    getStoredErrors: function() {
        try {
            return JSON.parse(localStorage.getItem('errorLog') || '[]');
        } catch (e) {
            return [];
        }
    },
    
    // Clear stored errors
    clearStoredErrors: function() {
        localStorage.removeItem('errorLog');
    },
    
    // Set user context (for error tracking)
    setUser: function(user) {
        if (typeof window !== 'undefined' && window.Sentry && this.dsn) {
            window.Sentry.setUser({
                id: user?.id,
                username: user?.username,
                role: user?.role,
                email: user?.email ? undefined : undefined // Don't send email for privacy
            });
        }
    }
};

// ========== ENHANCED ERROR HANDLING WRAPPER ==========

/**
 * Wrap async functions with error handling
 */
function withErrorHandling(fn, context = '') {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            ErrorMonitoring.captureException(error, {
                tags: { context: context || fn.name },
                extra: { args: args.length > 0 ? 'Arguments provided' : 'No arguments' }
            });
            throw error; // Re-throw to maintain behavior
        }
    };
}

// ========== INITIALIZATION ==========

// Auto-initialize if config is available
if (typeof window !== 'undefined') {
    // Check for Sentry configuration in environment or config
    const sentryConfig = window.ERROR_MONITORING_CONFIG || {};
    
    if (sentryConfig.enabled !== false) {
        ErrorMonitoring.init(sentryConfig);
    }
    
    // Make available globally
    window.ErrorMonitoring = ErrorMonitoring;
    window.withErrorHandling = withErrorHandling;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorMonitoring, withErrorHandling };
}
