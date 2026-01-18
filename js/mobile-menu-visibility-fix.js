// Mobile Menu Visibility Fix - Ensures menu links are always visible when menu is open
(function() {
    'use strict';
    
    function forceMobileMenuVisibility() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) {
            console.warn('Mobile menu element not found');
            return;
        }
        
        const mobileMenuContent = mobileMenu.querySelector('.mobile-menu-content');
        if (!mobileMenuContent) {
            console.warn('Mobile menu content not found');
            return;
        }
        
        // Check if menu is active
        const isActive = mobileMenu.classList.contains('active');
        
        if (isActive) {
            // Menu is open - force all content to be visible
            console.log('✅ Mobile menu is active - forcing visibility');
            
            // Force menu container styles
            mobileMenu.style.maxHeight = '600px';
            mobileMenu.style.opacity = '1';
            mobileMenu.style.overflow = 'visible';
            mobileMenu.style.display = 'block';
            mobileMenu.style.visibility = 'visible';
            
            // Force content container styles
            mobileMenuContent.style.display = 'flex';
            mobileMenuContent.style.visibility = 'visible';
            mobileMenuContent.style.opacity = '1';
            mobileMenuContent.style.flexDirection = 'column';
            mobileMenuContent.style.padding = '20px';
            mobileMenuContent.style.gap = '15px';
            
            // Force all links and buttons to be visible
            const allElements = mobileMenuContent.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });
            
            // Force buttons and links specifically
            const links = mobileMenuContent.querySelectorAll('a, button, .mobile-menu-link');
            links.forEach(link => {
                link.style.display = 'block';
                link.style.visibility = 'visible';
                link.style.opacity = '1';
                link.style.width = '100%';
            });
            
            console.log('✅ Forced', links.length, 'links to be visible');
        }
    }
    
    // Override toggleMobileMenu to ensure visibility
    const originalToggle = window.toggleMobileMenu;
    if (originalToggle) {
        window.toggleMobileMenu = function() {
            originalToggle();
            // Wait a tiny bit for the class to toggle, then force visibility
            setTimeout(forceMobileMenuVisibility, 50);
        };
    }
    
    // Also check periodically when menu might be opened
    let lastCheck = 0;
    setInterval(function() {
        const now = Date.now();
        if (now - lastCheck > 500) { // Check every 500ms
            lastCheck = now;
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                forceMobileMenuVisibility();
            }
        }
    }, 500);
    
    // Also check when menu class changes (MutationObserver)
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    setTimeout(forceMobileMenuVisibility, 10);
                }
            });
        });
        
        observer.observe(mobileMenu, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    console.log('✅ Mobile menu visibility fix script loaded');
})();
