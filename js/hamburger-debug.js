// Hamburger Menu Debug Script
// This script ensures the hamburger menu is visible on mobile devices

(function() {
    'use strict';
    
    function ensureHamburgerVisible() {
        const hamburger = document.querySelector('.hamburger');
        if (!hamburger) {
            console.error('Hamburger button not found in DOM!');
            return;
        }
        
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Force visibility on mobile
            hamburger.style.display = 'flex';
            hamburger.style.visibility = 'visible';
            hamburger.style.opacity = '1';
            hamburger.style.position = 'relative';
            hamburger.style.zIndex = '1001';
            
            console.log('✅ Hamburger menu forced to be visible on mobile');
            console.log('Hamburger computed styles:', {
                display: window.getComputedStyle(hamburger).display,
                visibility: window.getComputedStyle(hamburger).visibility,
                opacity: window.getComputedStyle(hamburger).opacity,
                width: window.innerWidth
            });
        } else {
            console.log('Desktop view - hamburger should be hidden');
        }
    }
    
    // Run on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureHamburgerVisible);
    } else {
        ensureHamburgerVisible();
    }
    
    // Also run on window load
    window.addEventListener('load', ensureHamburgerVisible);
    
    // Run on resize
    window.addEventListener('resize', ensureHamburgerVisible);
})();
