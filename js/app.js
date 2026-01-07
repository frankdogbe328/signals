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
                } else if (currentUser.role === 'student') {
                    window.location.href = 'student-dashboard.html';
                }
            }, 0);
        }
    }
});

// Course mapping - maps class IDs to their available courses
function getCoursesForClass(classId) {
    const courseMap = {
        // Telecom Technician (Upgrading - Telecom)
        'upgrading-telecom': [
            'Telecom',
            'Exchanges',
            'Electronics',
            'Antenna',
            'Basic maths',
            'Communication skills',
            'Fibre optics',
            'Power management',
            'Information Technology (Networking)'
        ],
        // Radio Technicians (Upgrading - RF)
        'upgrading-rf': [
            'Electronics',
            'Physics',
            'Antenna',
            'Basic math',
            'Communication skills',
            'Power management',
            'Information Technology (Networking)'
        ],
        // Signal Basic (all levels)
        'signal-basic-beginner': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Communication centre management',
            'Power management',
            'Front desk management',
            'Exchanges',
            'Information Technology',
            'Communication skills',
            'Basic physics',
            'Basic maths',
            'Cable networking',
            'Signal tactics'
        ],
        'signal-basic-ii-intermediate': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Communication centre management',
            'Power management',
            'Front desk management',
            'Exchanges',
            'Information Technology',
            'Communication skills',
            'Basic physics',
            'Basic maths',
            'Cable networking',
            'Signal tactics'
        ],
        'signal-basic-i-advanced': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Communication centre management',
            'Power management',
            'Front desk management',
            'Exchanges',
            'Information Technology',
            'Communication skills',
            'Basic physics',
            'Basic maths',
            'Cable networking',
            'Signal tactics'
        ],
        // Regimental Basic (all levels)
        'regimental-basic-beginner': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Basic math',
            'Communication skills',
            'Field cable networking',
            'Communication centre management',
            'Power management',
            'Information Technology',
            'Signal tactics'
        ],
        'regimental-basic-ii-intermediate': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Basic math',
            'Communication skills',
            'Field cable networking',
            'Communication centre management',
            'Power management',
            'Information Technology',
            'Signal tactics'
        ],
        'regimental-basic-i-advanced': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Basic math',
            'Communication skills',
            'Field cable networking',
            'Communication centre management',
            'Power management',
            'Information Technology',
            'Signal tactics'
        ],
        // Electronic Warfare (System Operators)
        'electronic-warfare': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Front desk management',
            'Basic math',
            'Communication skills',
            'Power management',
            'Information Technology',
            'Communication centre management',
            'Signal tactics'
        ],
        // Practical Drone Operators Course
        'drone-operators': [
            'UAS Fundamentals',
            'UAS Control',
            'UAS Systems',
            'UAS Operations',
            'Flight safety',
            'Payloads and Anti-Drone Systems'
        ]
    };
    
    return courseMap[classId] || [];
}

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
                id: 'student1',
                username: 'student1',
                password: 'password123',
                role: 'student',
                name: 'Lt. Sarah Adjei',
                class: 'signal-basic-beginner',
                courses: [] // Start with no courses - officers will register for courses
            },
            {
                id: 'student2',
                username: 'student2',
                password: 'password123',
                role: 'student',
                name: 'Capt. Kwame Asante',
                class: 'regimental-basic-beginner',
                courses: [] // Start with no courses - officers will register for courses
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Initialize materials if not exists (empty array - no sample data)
    if (!localStorage.getItem('materials')) {
        localStorage.setItem('materials', JSON.stringify([]));
    } else {
        // Clear any existing sample materials created by the system
        // Also remove materials with example/cyber courses
        const exampleCourses = [
            'cyber-security-fundamentals',
            'network-security',
            'cyber-defense-operations',
            'information-security-management',
            'cyber-threat-intelligence',
            'course1'
        ];
        
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const filteredMaterials = materials.filter(m => {
            // Remove materials uploaded by 'System' or with sample IDs
            // Also remove materials with example courses
            return m.uploadedBy !== 'System' && 
                   !m.id.startsWith('sample_') &&
                   !exampleCourses.includes(m.course);
        });
        localStorage.setItem('materials', JSON.stringify(filteredMaterials));
    }
    
    // Clean up existing users - remove example courses from their registrations
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exampleCourses = [
        'cyber-security-fundamentals',
        'network-security',
        'cyber-defense-operations',
        'information-security-management',
        'cyber-threat-intelligence',
        'course1'
    ];
    
    let usersUpdated = false;
    users.forEach(user => {
        if (user.role === 'student' && user.courses && Array.isArray(user.courses)) {
            const originalLength = user.courses.length;
            user.courses = user.courses.filter(course => !exampleCourses.includes(course));
            if (user.courses.length !== originalLength) {
                usersUpdated = true;
            }
        }
        // Also handle old single 'course' field
        if (user.role === 'student' && user.course && exampleCourses.includes(user.course)) {
            delete user.course;
            if (!user.courses) {
                user.courses = [];
            }
            usersUpdated = true;
        }
    });
    
    if (usersUpdated) {
        localStorage.setItem('users', JSON.stringify(users));
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

