// Mobile Menu Debug Script - Forces visibility and logs debug info
(function() {
    'use strict';
    
    console.log('🔍 Mobile Menu Debug Script Loading...');
    
    function debugMobileMenu() {
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
        
        // Log menu structure
        console.log('📋 Mobile Menu Debug Info:');
        console.log('- mobileMenu found:', !!mobileMenu);
        console.log('- mobileMenuContent found:', !!mobileMenuContent);
        console.log('- mobileMenuContent children:', mobileMenuContent.children.length);
        console.log('- mobileMenuContent innerHTML length:', mobileMenuContent.innerHTML.length);
        
        // Check all children
        const children = Array.from(mobileMenuContent.children);
        children.forEach((child, index) => {
            console.log(`  Child ${index + 1}:`, child.tagName, child.className || 'no class');
            if (child.tagName === 'BUTTON' || child.tagName === 'A') {
                console.log(`    - Text: ${child.textContent.trim()}`);
                console.log(`    - Display: ${window.getComputedStyle(child).display}`);
                console.log(`    - Visibility: ${window.getComputedStyle(child).visibility}`);
                console.log(`    - Opacity: ${window.getComputedStyle(child).opacity}`);
            }
        });
        
        // Force visibility of all links/buttons
        const links = mobileMenuContent.querySelectorAll('a, button');
        console.log(`- Found ${links.length} links/buttons in menu`);
        
        links.forEach((link, index) => {
            link.style.display = 'block';
            link.style.visibility = 'visible';
            link.style.opacity = '1';
            link.style.width = '100%';
            console.log(`  ✅ Link ${index + 1} forced visible: ${link.textContent.trim()}`);
        });
        
        // Check if menu is active
        const isActive = mobileMenu.classList.contains('active');
        console.log('- Menu active state:', isActive);
        
        // If menu is active but content not visible, force it
        if (isActive) {
            mobileMenu.style.maxHeight = '600px';
            mobileMenu.style.opacity = '1';
            mobileMenu.style.display = 'block';
            mobileMenu.style.visibility = 'visible';
            mobileMenuContent.style.display = 'flex';
            mobileMenuContent.style.visibility = 'visible';
            mobileMenuContent.style.opacity = '1';
            console.log('✅ Forced menu visibility when active');
        }
    }
    
    // Run debug on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(debugMobileMenu, 200);
        });
    } else {
        setTimeout(debugMobileMenu, 200);
    }
    
    // Also run when menu is toggled
    const originalToggle = window.toggleMobileMenu;
    if (typeof originalToggle === 'function') {
        window.toggleMobileMenu = function() {
            const result = originalToggle.apply(this, arguments);
            setTimeout(debugMobileMenu, 100);
            return result;
        };
    }
    
    console.log('✅ Mobile Menu Debug Script Loaded');
})();
