// Initialize app - check authentication and redirect if needed
document.addEventListener('DOMContentLoaded', function() {
    // Skip redirect logic if we're on exam portal pages
    // Check multiple ways to ensure we catch it
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    const isExamPortal = window.IS_EXAM_PORTAL || 
                         currentPath.includes('exam-portal') || 
                         currentHref.includes('exam-portal') || 
                         currentPage.includes('lecturer-exam-dashboard') || 
                         currentPage.includes('student-exam-portal');
    
    if (isExamPortal) {
        // Still initialize demo data but skip ALL redirect logic
        initializeDemoData();
        return; // Exit early - don't do any redirects
    }
    
    // Initialize demo data if not exists
    initializeDemoData();
    
    // Only check for redirect on index.html (login page)
    // Don't redirect if already on a dashboard page to prevent loops
    const currentPageName = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    const isLoginPage = currentPageName === 'index.html' || currentPageName === '' || currentPageName.endsWith('/');
    
    if (isLoginPage) {
        // Check if user is already logged in and redirect
        let currentUser = null;
        // Try secure session first
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getSecureSession) {
            const session = SecurityUtils.getSecureSession();
            if (session && session.user) {
                currentUser = session.user;
            }
        }
        // Fallback to legacy session
        if (!currentUser) {
            currentUser = getCurrentUser();
        }
        
        if (currentUser) {
            // Check for redirect parameter - sanitize to prevent open redirect
            const urlParams = new URLSearchParams(window.location.search);
            let redirectTo = urlParams.get('redirect');
            
            // Validate redirect URL
            if (redirectTo) {
                try {
                    const redirectUrl = new URL(redirectTo, window.location.origin);
                    if (redirectUrl.origin !== window.location.origin) {
                        redirectTo = null; // Block cross-origin redirects
                    } else {
                        redirectTo = redirectUrl.pathname + redirectUrl.search;
                    }
                } catch (e) {
                    // If URL parsing fails, treat as relative path
                    if (!redirectTo.startsWith('/') && !redirectTo.startsWith('./')) {
                        redirectTo = null;
                    }
                }
            }
            
            // Use setTimeout to prevent navigation throttling
            setTimeout(() => {
                // If redirect parameter exists and is valid, use it
                if (redirectTo && (redirectTo.includes('exam-portal') || redirectTo.includes('lecturer-dashboard') || redirectTo.includes('student-dashboard'))) {
                    window.location.href = redirectTo;
                } else {
                    // Default redirect based on role
                    if (currentUser.role === 'admin') {
                        window.location.href = 'admin-portal.html';
                    } else if (currentUser.role === 'lecturer') {
                        window.location.href = 'lecturer-dashboard.html';
                    } else if (currentUser.role === 'student') {
                        window.location.href = 'student-dashboard.html';
                    }
                }
            }, 0);
        }
    }
});

// Course mapping - maps class IDs to their available courses (subjects)
function getCoursesForClass(classId) {
    const courseMap = {
        // SIGNALS BASIC - Signal Basic subjects
        'signals-basic': [
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
            'Signal tactics',
            'Telecom'
        ],
        // SIGNALS B III – B II - Signal Basic subjects (intermediate level)
        'signals-b-iii-b-ii': [
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
            'Signal tactics',
            'Telecom'
        ],
        // SIGNALS B II – B I - Signal Basic subjects (advanced level)
        'signals-b-ii-b-i': [
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
            'Signal tactics',
            'Telecom'
        ],
        // SUPERINTENDENT - Signal Superintendent Course
        'superintendent': [
            'Communication Centre Management',
            'Communication Skills',
            'Voice Procedure',
            'Information Technology',
            'Power Management',
            'Service Writing',
            'Cable Networking',
            'Antenna'
        ],
        // PRE-QUALIFYING - Signal Officers – Pre-Qualifying Course
        'pre-qualifying': [
            'Communication Centre Management',
            'Communication Skills',
            'Voice Procedure',
            'Information Technology',
            'Power Management',
            'Service Writing',
            'Cable Networking',
            'Antenna'
        ],
        // REGIMENTAL BASIC - Signal – Regimental & Basic subjects (includes Method of instructions)
        'regimental-basic': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna',
            'Communication centre management',
            'Basic maths',
            'Communication skills',
            'Power management',
            'Information Technology',
            'Signal tactics',
            'Method of instructions',
            'Telecom'
        ],
        // REGIMENTAL B III – B II - Signal – Regimental Basic subjects (intermediate level)
        'regimental-b-iii-b-ii': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Basic math',
            'Communication skills',
            'Field cable networking',
            'Communication centre management',
            'Power management',
            'Information Technology',
            'Signal tactics',
            'Telecom'
        ],
        // REGIMENTAL B II – B I - Signal – Regimental Basic subjects (advanced level)
        'regimental-b-ii-b-i': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna theory',
            'Basic math',
            'Communication skills',
            'Field cable networking',
            'Communication centre management',
            'Power management',
            'Information Technology',
            'Signal tactics',
            'Telecom'
        ],
        // RSO / RSI - Regimental Signal Officers / Instructors Course
        'rso-rsi': [
            'Signal Superintendent Course',
            'Communication Centre Management',
            'Signal Tactics',
            'Field Cable',
            'Service Writing',
            'Information Technology',
            'Voice Procedure',
            'Antenna',
            'Power Management'
        ],
        // ELECTRONIC WARFARE COURSE - EW
        'electronic-warfare-course': [
            'Voice Procedure',
            'Telegraph Procedure',
            'Antenna Theory',
            'Mathematics',
            'Communication Skills',
            'Service Writing',
            'Virtual machines'
        ],
        // TACTICAL DRONE COURSE - Practical Drone Operators Course subjects
        'tactical-drone-course': [
            'UAS Fundamentals',
            'UAS Control',
            'UAS Systems',
            'UAS Operations',
            'Flight safety',
            'Payloads and Anti-Drone Systems'
        ],
        
        // ========== BACKWARD COMPATIBILITY - Old Class IDs ==========
        // Map old class IDs to new ones so old accounts still work
        
        // Old Signal Basic classes
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
        // Old Regimental Basic classes
        'regimental-basic-beginner': [
            'Voice procedure',
            'Telegraphy procedure',
            'Antenna',
            'Communication centre management',
            'Basic maths',
            'Communication skills',
            'Power management',
            'Information Technology',
            'Signal tactics',
            'Method of instructions'
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
        // Old Electronic Warfare
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
        // Old Upgrading classes
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
        'upgrading-rf': [
            'Electronics',
            'Physics',
            'Antenna',
            'Basic math',
            'Communication skills',
            'Power management',
            'Information Technology (Networking)'
        ],
        // Old Drone Operators
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
    // Note: Since we're using Supabase, demo accounts are not created automatically
    // Demo accounts should only exist in Supabase if manually created
    // localStorage is kept only for backward compatibility/fallback
    
    // Clear any existing localStorage users to avoid confusion
    // Users should be registered through the system, not through localStorage
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
        // Supabase is available, don't create localStorage demo accounts
        // localStorage will be used only as fallback
        return;
    }
    
    // Only create localStorage users if Supabase is not available (fallback mode)
    // This is for backward compatibility only
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
                class: 'signals-basic',
                courses: []
            },
            {
                id: 'student2',
                username: 'student2',
                password: 'password123',
                role: 'student',
                name: 'Capt. Kwame Asante',
                class: 'regimental-basic',
                courses: []
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

// Get current logged in user - Enhanced with secure session support
function getCurrentUser() {
    // Try secure session first
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getSecureSession) {
        const session = SecurityUtils.getSecureSession();
        if (session && session.user) {
            return session.user;
        }
    }
    
    // Fallback to legacy sessionStorage
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// Set current user - Enhanced with secure session support
function setCurrentUser(user) {
    // Set secure session if available
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.setSecureSession) {
        SecurityUtils.setSecureSession(user, 480); // 8 hour session
    }
    
    // Also set legacy session for backward compatibility
    try {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
        console.error('Error setting user session:', e);
    }
}

// Clear current user - Enhanced with secure session cleanup
function clearCurrentUser() {
    // Clear secure session
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
        SecurityUtils.clearSecureSession();
    }
    
    // Clear legacy session
    try {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
    } catch (e) {
        console.error('Error clearing user session:', e);
    }
}

// Logout function - Enhanced with complete session cleanup
function logout() {
    // Clear secure session
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
        SecurityUtils.clearSecureSession();
    }
    
    // Clear legacy sessions
    clearCurrentUser();
    
    // Clear CSRF token
    try {
        sessionStorage.removeItem('csrfToken');
    } catch (e) {
        console.error('Error clearing CSRF token:', e);
    }
    
    // Check if we're in the exam portal
    const currentPath = window.location.pathname;
    const isExamPortal = currentPath.includes('exam-portal');
    
    if (isExamPortal) {
        // Redirect to exam portal login
        window.location.href = 'login.html';
    } else {
        // Redirect to main LMS login
        window.location.href = 'index.html';
    }
}

