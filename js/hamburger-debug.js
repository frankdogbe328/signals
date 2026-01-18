// Hamburger Menu Debug Script
// This script ensures the hamburger menu is visible on mobile devices

(function() {
    'use strict';
    
    function ensureHamburgerVisible() {
        const hamburger = document.querySelector('.hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        const navUser = document.querySelector('.nav-user');
        
        if (!hamburger) {
            console.error('❌ Hamburger button not found in DOM!');
            return;
        }
        
        if (!mobileMenu) {
            console.error('❌ Mobile menu not found in DOM!');
            return;
        }
        
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Force hamburger visibility on mobile
            hamburger.style.display = 'flex';
            hamburger.style.visibility = 'visible';
            hamburger.style.opacity = '1';
            hamburger.style.position = 'relative';
            hamburger.style.zIndex = '1001';
            
            // Ensure nav-user is hidden
            if (navUser) {
                navUser.style.display = 'none';
                navUser.style.visibility = 'hidden';
                navUser.style.opacity = '0';
            }
            
            // Ensure mobile menu content is visible when active
            const mobileMenuContent = mobileMenu.querySelector('.mobile-menu-content');
            if (mobileMenuContent) {
                // Make sure all links are visible
                const links = mobileMenuContent.querySelectorAll('a, button');
                links.forEach(link => {
                    link.style.display = 'block';
                    link.style.visibility = 'visible';
                    link.style.opacity = '1';
                });
            }
            
            console.log('✅ Hamburger menu forced to be visible on mobile');
            console.log('Mobile menu has', mobileMenuContent ? mobileMenuContent.children.length : 0, 'children');
            console.log('Width:', window.innerWidth, 'px');
        } else {
            console.log('Desktop view - hamburger should be hidden');
        }
    }
    
    // Enhance toggleMobileMenu to ensure menu displays properly
    const originalToggle = window.toggleMobileMenu;
    window.toggleMobileMenu = function() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && originalToggle) {
            originalToggle();
            
            // Ensure menu is visible when active
            setTimeout(() => {
                if (mobileMenu.classList.contains('active')) {
                    mobileMenu.style.maxHeight = '600px';
                    mobileMenu.style.opacity = '1';
                    const content = mobileMenu.querySelector('.mobile-menu-content');
                    if (content) {
                        content.style.display = 'flex';
                        content.style.visibility = 'visible';
                        content.style.opacity = '1';
                    }
                    console.log('✅ Mobile menu activated and made visible');
                }
            }, 50);
        }
    };
    
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
