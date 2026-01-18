// Debug script to verify hamburger menu content is loaded
// This ensures the mobile menu has content and is visible when opened

(function() {
    'use strict';
    
    function checkHamburgerContent() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuContent = mobileMenu ? mobileMenu.querySelector('.mobile-menu-content') : null;
        
        if (!mobileMenu) {
            console.error('❌ mobileMenu element not found!');
            return;
        }
        
        if (!mobileMenuContent) {
            console.error('❌ mobile-menu-content element not found!');
            return;
        }
        
        const links = mobileMenuContent.querySelectorAll('button, a');
        console.log('🔍 Hamburger Menu Debug:', {
            menuExists: !!mobileMenu,
            contentExists: !!mobileMenuContent,
            linksCount: links.length,
            isActive: mobileMenu.classList.contains('active'),
            links: Array.from(links).map(link => ({
                text: link.textContent.trim(),
                visible: window.getComputedStyle(link).display !== 'none',
                opacity: window.getComputedStyle(link).opacity
            }))
        });
        
        // Force content to be visible if menu is active
        if (mobileMenu.classList.contains('active')) {
            console.log('✅ Menu is active - forcing visibility of all content');
            
            // Force menu container
            mobileMenu.style.cssText += `
                max-height: 600px !important;
                opacity: 1 !important;
                overflow: visible !important;
                display: block !important;
                visibility: visible !important;
            `;
            
            // Force content container
            mobileMenuContent.style.cssText += `
                display: flex !important;
                flex-direction: column !important;
                padding: 20px !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
            
            // Force all links to be visible
            links.forEach((link, index) => {
                link.style.cssText += `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    width: 100% !important;
                `;
                console.log(`✅ Link ${index + 1} forced visible: ${link.textContent.trim()}`);
            });
        }
    }
    
    // Check on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkHamburgerContent);
    } else {
        checkHamburgerContent();
    }
    
    // Check when menu is toggled
    const originalToggle = window.toggleMobileMenu;
    if (originalToggle) {
        window.toggleMobileMenu = function() {
            originalToggle();
            setTimeout(checkHamburgerContent, 100); // Check after toggle
        };
    }
    
    // Also check periodically when menu is active
    setInterval(function() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            checkHamburgerContent();
        }
    }, 500);
    
    console.log('✅ Hamburger content debug script loaded');
})();