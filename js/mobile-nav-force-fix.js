// Mobile Navigation Force Fix - Very aggressive approach to hide nav-user and position hamburger
(function() {
    'use strict';
    
    function forceMobileNavFix() {
        const navUser = document.querySelector('.nav-user');
        const hamburger = document.querySelector('.hamburger');
        const navContainer = document.querySelector('.nav-container');
        
        // Check if we're on mobile (more lenient check)
        const isMobile = window.innerWidth <= 800 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('🔧 Mobile detected - applying force fix');
            console.log('Screen width:', window.innerWidth);
            
            // AGGRESSIVELY hide nav-user and all its contents
            if (navUser) {
                // Hide the container itself
                navUser.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; margin: 0 !important; padding: 0 !important;';
                
                // Hide ALL children recursively
                const allNavUserElements = navUser.querySelectorAll('*');
                allNavUserElements.forEach(el => {
                    el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
                });
                
                // Also try removing from DOM flow
                navUser.style.setProperty('display', 'none', 'important');
                navUser.style.setProperty('visibility', 'hidden', 'important');
                
                console.log('✅ nav-user forcefully hidden');
            }
            
            // FORCE hamburger to right side
            if (hamburger) {
                hamburger.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; margin-left: auto !important; order: 999 !important; position: relative !important; z-index: 1001 !important;';
                
                // Ensure it's visible
                hamburger.style.setProperty('display', 'flex', 'important');
                hamburger.style.setProperty('margin-left', 'auto', 'important');
                hamburger.style.setProperty('order', '999', 'important');
                
                console.log('✅ Hamburger forced to right side');
            }
            
            // Ensure nav-container uses space-between
            if (navContainer) {
                navContainer.style.setProperty('justify-content', 'space-between', 'important');
                console.log('✅ nav-container justify-content set');
            }
        } else {
            // Desktop - restore normal styles
            if (navUser) {
                navUser.style.cssText = '';
            }
        }
    }
    
    // Run immediately
    forceMobileNavFix();
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceMobileNavFix);
    }
    
    // Run on window load
    window.addEventListener('load', forceMobileNavFix);
    
    // Run on resize
    window.addEventListener('resize', forceMobileNavFix);
    
    // Run on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(forceMobileNavFix, 100);
    });
    
    // Run periodically on mobile (every 10 seconds instead of 2 to prevent lag) - only if needed
    let intervalId = null;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Only run interval if hamburger is not visible (smart check to prevent unnecessary work)
        intervalId = setInterval(function() {
            const hamburger = document.querySelector('.hamburger');
            const navUser = document.querySelector('.nav-user');
            if (window.innerWidth <= 800) {
                // Only apply fix if nav-user is still visible (fix hasn't worked yet)
                if (navUser) {
                    const computedStyle = window.getComputedStyle(navUser);
                    if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                        forceMobileNavFix();
                    } else {
                        // Fix has worked, check less frequently or stop
                        if (hamburger && window.getComputedStyle(hamburger).display !== 'none') {
                            // Both conditions met, reduce to checking every 30 seconds
                            if (intervalId) {
                                clearInterval(intervalId);
                                intervalId = setInterval(forceMobileNavFix, 30000); // Every 30 seconds once fixed
                            }
                        }
                    }
                }
            }
        }, 10000); // Reduced from 2000ms to 10000ms (10 seconds) to prevent lag
    }
    
    console.log('✅ Mobile nav force fix script loaded');
})();
