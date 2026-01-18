// Mobile menu functionality
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenu && hamburger) {
        const isActive = mobileMenu.classList.contains('active');
        
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        
        // Force visibility when active
        if (!isActive) {
            // Menu is opening - ensure content is visible
            const mobileMenuContent = mobileMenu.querySelector('.mobile-menu-content');
            if (mobileMenuContent) {
                // Force all children to be visible
                const allChildren = mobileMenuContent.querySelectorAll('*');
                allChildren.forEach(child => {
                    child.style.display = '';
                    child.style.visibility = 'visible';
                    child.style.opacity = '1';
                });
                
                // Force links to be visible
                const links = mobileMenuContent.querySelectorAll('a, button');
                links.forEach(link => {
                    link.style.display = 'block';
                    link.style.visibility = 'visible';
                    link.style.opacity = '1';
                    link.style.width = '100%';
                });
            }
            
            // Ensure menu container is visible
            mobileMenu.style.maxHeight = '600px';
            mobileMenu.style.opacity = '1';
            mobileMenu.style.overflow = 'visible';
            mobileMenu.style.visibility = 'visible';
        } else {
            // Menu is closing
            mobileMenu.style.maxHeight = '0';
            mobileMenu.style.opacity = '0';
        }
        
        console.log('Mobile menu toggled:', {
            isNowActive: mobileMenu.classList.contains('active'),
            menuElement: !!mobileMenu,
            contentElement: !!mobileMenu.querySelector('.mobile-menu-content'),
            linksCount: mobileMenu.querySelectorAll('.mobile-menu-content a, .mobile-menu-content button').length
        });
    } else {
        console.error('Mobile menu elements not found:', {
            mobileMenu: !!mobileMenu,
            hamburger: !!hamburger
        });
    }
}

// Make toggleMobileMenu globally accessible
window.toggleMobileMenu = toggleMobileMenu;

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    const navContainer = document.querySelector('.nav-container');
    
    if (mobileMenu && hamburger && navContainer) {
        if (!navContainer.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }
});

// Close mobile menu on window resize (if resized to desktop)
window.addEventListener('resize', function() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (window.innerWidth > 768) {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    }
});

