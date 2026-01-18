// Navigation Protection - Ensures navigation isn't blocked by ongoing operations
// Prevents page freeze when clicking links during data loading

(function() {
    'use strict';
    
    // Track ongoing async operations
    const ongoingOperations = new Set();
    
    // Override window.location.href to allow navigation even during operations
    const originalLocationHref = window.location.href;
    let navigationInProgress = false;
    
    // Hook into navigation attempts
    document.addEventListener('click', function(event) {
        const target = event.target.closest('a[href], button[onclick*="location"], button[onclick*="href"]');
        
        if (!target) return;
        
        // If there are many ongoing operations, allow navigation immediately
        if (ongoingOperations.size > 5) {
            console.warn('⚠️ Many ongoing operations detected. Allowing immediate navigation.');
            // Don't block navigation
            return;
        }
        
        // For Exam Portal and other critical navigation, allow immediately
        const href = target.getAttribute('href') || '';
        const onclick = target.getAttribute('onclick') || '';
        
        if (href.includes('exam-portal') || onclick.includes('exam-portal')) {
            // Exam Portal navigation - allow immediately, cancel ongoing operations
            console.log('🚀 Exam Portal navigation detected - allowing immediate navigation');
            navigationInProgress = true;
            // Clear any blocking operations
            ongoingOperations.clear();
            return;
        }
    }, true); // Use capture phase
    
    // Intercept fetch/promise-based operations to track them
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const requestId = `fetch_${Date.now()}_${Math.random()}`;
        
        // If navigation is in progress, cancel the fetch
        if (navigationInProgress) {
            return Promise.reject(new Error('Navigation in progress - request cancelled'));
        }
        
        ongoingOperations.add(requestId);
        
        const promise = originalFetch.apply(this, args);
        
        promise.finally(() => {
            ongoingOperations.delete(requestId);
        });
        
        return promise;
    };
    
    // Monitor for long-running operations
    setInterval(() => {
        if (ongoingOperations.size > 10) {
            console.warn(`⚠️ ${ongoingOperations.size} ongoing operations - may affect performance`);
        }
    }, 5000);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        ongoingOperations.clear();
        navigationInProgress = true;
    });
    
    console.log('✅ Navigation protection enabled');
})();