// Initialize app - check authentication and redirect if needed
document.addEventListener('DOMContentLoaded', function() {
    // Initialize demo data if not exists
    initializeDemoData();
    
    // Only check for redirect on index.html (login page)
    // Don't redirect if already on a dashboard page to prevent loops
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    const isLoginPage = currentPage === 'index.html' || currentPage === '' || currentPage.endsWith('/');
    
    if (isLoginPage) {
        // Check if user is already logged in and redirect
        const currentUser = getCurrentUser();
        if (currentUser) {
            // Use setTimeout to prevent navigation throttling
            setTimeout(() => {
                if (currentUser.role === 'lecturer') {
                    window.location.href = 'lecturer-dashboard.html';
                } else if (currentUser.role === 'officer') {
                    window.location.href = 'officer-dashboard.html';
                }
            }, 0);
        }
    }
});

// Initialize demo data
function initializeDemoData() {
    // Initialize users if not exists
    if (!localStorage.getItem('users')) {
        const users = [
            {
                id: 'lecturer1',
                username: 'lecturer1',
                password: 'password123',
                role: 'lecturer',
                name: 'Dr. John Mensah'
            },
            {
                id: 'officer1',
                username: 'officer1',
                password: 'password123',
                role: 'officer',
                name: 'Lt. Sarah Adjei',
                class: 'class-a',
                courses: ['cyber-security-fundamentals', 'network-security', 'cyber-defense-operations'] // Cyber courses for testing
            },
            {
                id: 'officer2',
                username: 'officer2',
                password: 'password123',
                role: 'officer',
                name: 'Capt. Kwame Asante',
                class: 'class-b',
                courses: ['cyber-security-fundamentals', 'information-security-management'] // Cyber courses for testing
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Initialize materials if not exists
    if (!localStorage.getItem('materials')) {
        // Add some sample cyber course materials for testing
        const sampleMaterials = [
            {
                id: 'sample_1',
                course: 'cyber-security-fundamentals',
                class: 'class-a',
                title: 'Introduction to Cyber Security',
                type: 'text',
                content: 'Cyber security is the practice of protecting systems, networks, and programs from digital attacks. This module covers the basics of cyber threats, vulnerabilities, and defense mechanisms.',
                description: 'Learn the fundamental concepts of cyber security',
                category: 'Cyber Security Basics',
                sequence: 1,
                uploadedBy: 'System',
                uploadedAt: new Date().toISOString()
            },
            {
                id: 'sample_2',
                course: 'network-security',
                class: 'class-a',
                title: 'Network Security Protocols',
                type: 'text',
                content: 'Network security involves implementing measures to protect network infrastructure and data. Topics include firewalls, VPNs, intrusion detection systems, and secure network design.',
                description: 'Understanding network security protocols and implementation',
                category: 'Network Defense',
                sequence: 1,
                uploadedBy: 'System',
                uploadedAt: new Date().toISOString()
            },
            {
                id: 'sample_3',
                course: 'cyber-defense-operations',
                class: 'class-a',
                title: 'Defensive Cyber Operations',
                type: 'text',
                content: 'Defensive cyber operations focus on protecting military networks and systems from cyber attacks. This includes monitoring, detection, response, and recovery procedures.',
                description: 'Military cyber defense strategies and operations',
                category: 'Defense Operations',
                sequence: 1,
                uploadedBy: 'System',
                uploadedAt: new Date().toISOString()
            },
            {
                id: 'sample_4',
                course: 'cyber-security-fundamentals',
                class: 'class-b',
                title: 'Threat Landscape Analysis',
                type: 'text',
                content: 'Understanding the current cyber threat landscape is crucial for effective defense. This module covers common attack vectors, threat actors, and attack methodologies.',
                description: 'Analyzing current cyber threats and attack patterns',
                category: 'Threat Analysis',
                sequence: 2,
                uploadedBy: 'System',
                uploadedAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('materials', JSON.stringify(sampleMaterials));
    }
    
    // Initialize progress if not exists
    if (!localStorage.getItem('progress')) {
        localStorage.setItem('progress', JSON.stringify({}));
    }
}

// Get current logged in user
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// Clear current user
function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

// Logout function
function logout() {
    clearCurrentUser();
    window.location.href = 'index.html';
}

