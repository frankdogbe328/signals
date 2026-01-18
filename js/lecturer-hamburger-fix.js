// Lecturer Portal Hamburger Visibility Fix - Very Aggressive
// This script ensures hamburger is ALWAYS visible on mobile devices

(function() {
    'use strict';
    
    console.log('🔧 Lecturer hamburger fix script loaded');
    
    function forceHamburgerVisible() {
        const hamburger = document.querySelector('.hamburger');
        const navUser = document.querySelector('.nav-user');
        const navContainer = document.querySelector('.nav-container');
        
        if (!hamburger) {
            console.error('❌ Hamburger button not found!');
            return;
        }
        
        // Detect mobile - use multiple methods
        const isMobile = window.innerWidth <= 768 || 
                        window.innerWidth <= 800 ||
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
        
        if (isMobile) {
            console.log('📱 Mobile detected - forcing hamburger visible');
            console.log('Screen width:', window.innerWidth);
            
            // FORCE hamburger to be visible with maximum priority and CLICKABLE
            hamburger.style.cssText = `
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 10001 !important;
                margin-left: auto !important;
                order: 9999 !important;
                min-width: 44px !important;
                min-height: 44px !important;
                padding: 8px !important;
                background: rgba(255, 255, 255, 0.3) !important;
                border: 2px solid rgba(255, 255, 255, 0.6) !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                pointer-events: auto !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: rgba(255, 255, 255, 0.3) !important;
            `;
            
            // Ensure hamburger is clickable - remove any event blocking
            hamburger.style.pointerEvents = 'auto';
            hamburger.style.touchAction = 'manipulation';
            
            // Attach click handler directly if not already attached
            if (!hamburger.hasAttribute('data-click-handler-attached')) {
                hamburger.setAttribute('data-click-handler-attached', 'true');
                
                // Remove onclick to prevent conflicts, use addEventListener instead
                hamburger.removeAttribute('onclick');
                
                // Add click event listener
                hamburger.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🍔 Hamburger clicked!');
                    
                    if (typeof window.toggleMobileMenu === 'function') {
                        window.toggleMobileMenu();
                    } else {
                        console.error('toggleMobileMenu function not found!');
                    }
                }, { passive: false });
                
                // Also add touch events for mobile
                hamburger.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🍔 Hamburger touched!');
                    
                    if (typeof window.toggleMobileMenu === 'function') {
                        window.toggleMobileMenu();
                    }
                }, { passive: false });
            }
            
            // Ensure all spans inside hamburger are visible
            const spans = hamburger.querySelectorAll('span');
            spans.forEach(span => {
                span.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    width: 25px !important;
                    height: 3px !important;
                    background: white !important;
                    margin: 3px 0 !important;
                    border-radius: 2px !important;
                `;
            });
            
            // FORCE nav-user to be completely hidden
            if (navUser) {
                navUser.style.cssText = `
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                    position: absolute !important;
                    left: -9999px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    pointer-events: none !important;
                `;
                
                // Hide all children
                const allChildren = navUser.querySelectorAll('*');
                allChildren.forEach(child => {
                    child.style.cssText = `
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    `;
                });
            }
            
            // Ensure nav-container layout
            if (navContainer) {
                navContainer.style.cssText = `
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    width: 100% !important;
                    flex-wrap: nowrap !important;
                `;
            }
            
            console.log('✅ Hamburger forced visible:', {
                display: hamburger.style.display,
                visibility: hamburger.style.visibility,
                opacity: hamburger.style.opacity,
                zIndex: hamburger.style.zIndex
            });
        } else {
            // Desktop - hide hamburger
            hamburger.style.display = 'none';
        }
    }
    
    // Run immediately
    forceHamburgerVisible();
    
    // Run multiple times to catch any timing issues
    setTimeout(forceHamburgerVisible, 100);
    setTimeout(forceHamburgerVisible, 500);
    setTimeout(forceHamburgerVisible, 1000);
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceHamburgerVisible);
    }
    
    // Run on window load
    window.addEventListener('load', forceHamburgerVisible);
    
    // Run on resize
    window.addEventListener('resize', forceHamburgerVisible);
    
    // Run on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(forceHamburgerVisible, 100);
        setTimeout(forceHamburgerVisible, 500);
    });
    
    // Interval check for mobile (every 5 seconds to prevent freezing) - reduced from 1 second
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Only run interval if hamburger is not visible (to prevent unnecessary checks)
        const intervalId = setInterval(function() {
            const hamburger = document.querySelector('.hamburger');
            if (hamburger && window.innerWidth <= 768) {
                const computedStyle = window.getComputedStyle(hamburger);
                if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                    forceHamburgerVisible();
                }
            } else if (window.innerWidth > 768) {
                clearInterval(intervalId); // Stop interval on desktop
            }
        }, 5000); // Reduced from 1000ms to 5000ms (5 seconds) to prevent freezing
    }
    
    // Also use MutationObserver to catch any DOM changes
    const observer = new MutationObserver(function(mutations) {
        const hamburger = document.querySelector('.hamburger');
        if (hamburger && window.innerWidth <= 768) {
            forceHamburgerVisible();
        }
    });
    
    // Observe changes to navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        observer.observe(navbar, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    console.log('✅ Lecturer hamburger fix initialized');
})();
