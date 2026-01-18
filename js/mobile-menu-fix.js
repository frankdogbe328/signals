// Mobile Menu Fix Script
// This script ensures the mobile menu is working and visible

(function() {
    'use strict';
    
    // Ensure toggleMobileMenu is globally accessible
    if (typeof window.toggleMobileMenu === 'undefined') {
        window.toggleMobileMenu = function() {
            const mobileMenu = document.getElementById('mobileMenu');
            const hamburger = document.querySelector('.hamburger');
            
            if (mobileMenu && hamburger) {
                mobileMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
                
                // Debug log
                console.log('Mobile menu toggled:', {
                    menuActive: mobileMenu.classList.contains('active'),
                    hamburgerActive: hamburger.classList.contains('active')
                });
            } else {
                console.error('Mobile menu elements not found:', {
                    mobileMenu: !!mobileMenu,
                    hamburger: !!hamburger
                });
            }
        };
    }
    
    // Verify mobile menu content is visible on load
    function verifyMobileMenuContent() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) {
            console.error('Mobile menu element not found!');
            return;
        }
        
        const mobileMenuContent = mobileMenu.querySelector('.mobile-menu-content');
        if (!mobileMenuContent) {
            console.error('Mobile menu content not found!');
            return;
        }
        
        const links = mobileMenuContent.querySelectorAll('.mobile-menu-link, a.btn, button.btn');
        console.log('Mobile menu links found:', links.length);
        
        // Ensure links are visible
        links.forEach(link => {
            link.style.display = 'block';
            link.style.visibility = 'visible';
            link.style.opacity = '1';
        });
        
        // Check if menu has content
        if (links.length === 0) {
            console.warn('⚠️ Mobile menu appears to be empty!');
            console.log('Mobile menu HTML:', mobileMenuContent.innerHTML.substring(0, 200));
        } else {
            console.log('✅ Mobile menu has', links.length, 'navigation links');
        }
    }
    
    // Run verification when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(verifyMobileMenuContent, 100);
        });
    } else {
        setTimeout(verifyMobileMenuContent, 100);
    }
    
    // Also verify on window load
    window.addEventListener('load', function() {
        setTimeout(verifyMobileMenuContent, 200);
    });
})();
