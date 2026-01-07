// Student dashboard functionality
let currentMaterialId = null; // Store current material ID for modal
let isInitialized = false; // Flag to prevent repeated initialization
let lastMaterialsHTML = ''; // Store last materials HTML to prevent unnecessary updates
let lastCoursesHTML = ''; // Store last courses HTML to prevent unnecessary updates
let isUpdating = false; // Flag to prevent concurrent updates

document.addEventListener('DOMContentLoaded', function() {
    // Prevent multiple initializations
    if (isInitialized) return;
    isInitialized = true;
    // Check authentication
    let currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // Migrate old course format to courses array if needed (only once)
    const wasMigrated = migrateUserCourses(currentUser);
    
    // Get updated user after migration if needed
    if (wasMigrated) {
        currentUser = getCurrentUser();
    }
    
    // Display student name and info (set once, no repeated updates)
    const studentNameEl = document.getElementById('studentName');
    if (studentNameEl) {
        studentNameEl.textContent = currentUser.name;
    }
    
    // Update mobile menu name
    const mobileStudentName = document.getElementById('mobileStudentName');
    if (mobileStudentName) {
        mobileStudentName.textContent = currentUser.name;
    }
    
    // Update student info text directly (with check to prevent blinking)
    const studentInfoEl = document.getElementById('studentInfo');
    if (studentInfoEl) {
        const courses = currentUser.courses || [];
        const coursesText = courses.length > 0 
            ? `Registered Courses: ${courses.length}` 
            : 'No courses registered yet';
        const newText = `Welcome, ${currentUser.name}. Class: ${currentUser.class || 'N/A'} | ${coursesText}`;
        
        // Only update if text changed
        if (studentInfoEl.textContent !== newText) {
            studentInfoEl.textContent = newText;
            lastStudentInfoText = newText;
        }
    }
    
    // Populate course registration dropdown
    populateCourseRegistrationDropdown();
    
    // Load registered courses first
    loadRegisteredCourses();
    
    // Load materials and progress (use requestAnimationFrame to batch DOM updates)
    requestAnimationFrame(() => {
        loadMaterials();
        updateProgress();
    });
    
    // Handle course filter (add event listener after dropdown is populated)
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) {
        // Remove any existing listeners to prevent duplicates
        courseFilter.removeEventListener('change', filterMaterials);
        courseFilter.addEventListener('change', filterMaterials);
    }
    
    // Handle category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.removeEventListener('change', filterMaterials);
        categoryFilter.addEventListener('change', filterMaterials);
    }
});

// Migrate old users with single 'course' to 'courses' array
// Returns true if migration occurred, false otherwise
function migrateUserCourses(user) {
    let migrated = false;
    
    if (user.course && !user.courses) {
        user.courses = [user.course];
        delete user.course;
        migrated = true;
    } else if (!user.courses) {
        user.courses = [];
        migrated = true;
    }
    
    // Only update storage if migration occurred
    if (migrated) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
            setCurrentUser(user);
        }
    }
    
    return migrated;
}

// Store last updated text to prevent unnecessary DOM updates
let lastStudentInfoText = '';

function updateStudentInfo() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const courses = currentUser.courses || [];
    const coursesText = courses.length > 0 
        ? `Registered Courses: ${courses.length}` 
        : 'No courses registered yet';
    
    const newText = `Welcome, ${currentUser.name}. Class: ${currentUser.class || 'N/A'} | ${coursesText}`;
    
    // Only update if text actually changed
    if (newText === lastStudentInfoText) return;
    lastStudentInfoText = newText;
    
    const studentInfoEl = document.getElementById('studentInfo');
    if (studentInfoEl) {
        studentInfoEl.textContent = newText;
    }
}

// Populate course registration dropdown based on student's class
function populateCourseRegistrationDropdown() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.class) return;
    
    const courseSelect = document.getElementById('registerCourseSelect');
    if (!courseSelect) return;
    
    const availableCourses = getCoursesForClass(currentUser.class);
    const registeredCourses = currentUser.courses || [];
    
    // Filter out already registered courses
    const unregisteredCourses = availableCourses.filter(course => !registeredCourses.includes(course));
    
    courseSelect.innerHTML = '<option value="">Select a course</option>' +
        unregisteredCourses.map(course => `<option value="${course}">${course}</option>`).join('');
}

function loadRegisteredCourses() {
    if (isUpdating) return; // Prevent concurrent updates
    isUpdating = true;
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.class) {
        isUpdating = false;
        return;
    }
    
    // Get valid courses for this class
    const validCoursesForClass = getCoursesForClass(currentUser.class);
    const registeredCourses = currentUser.courses || [];
    
    // Filter to only show registered courses that are valid for this class
    const validRegisteredCourses = registeredCourses.filter(course => 
        validCoursesForClass.includes(course)
    );
    
    // If there are invalid courses, clean them up
    if (validRegisteredCourses.length !== registeredCourses.length) {
        currentUser.courses = validRegisteredCourses;
        // Update in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            setCurrentUser(currentUser);
        }
    }
    
    const registeredCoursesList = document.getElementById('registeredCoursesList');
    if (!registeredCoursesList) {
        isUpdating = false;
        return;
    }
    
    let newHTML = '';
    if (validRegisteredCourses.length === 0) {
        newHTML = '<p class="empty-state" style="padding: 10px;">No courses registered. Register for a course above.</p>';
    } else {
        newHTML = validRegisteredCourses.map(course => `
            <div class="registered-course-item" style="display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                <span style="font-weight: 600;">${course}</span>
            </div>
        `).join('');
    }
    
    // Only update if content changed
    if (newHTML !== lastCoursesHTML) {
        registeredCoursesList.innerHTML = newHTML;
        lastCoursesHTML = newHTML;
    }
    
    // Update course filter dropdown (without triggering change event)
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) {
        const currentValue = courseFilter.value;
        const newHTML = '<option value="all">All My Courses</option>' +
            validRegisteredCourses.map(course => `<option value="${course}">${course}</option>`).join('');
        
        // Only update if content changed
        if (courseFilter.innerHTML !== newHTML) {
            courseFilter.innerHTML = newHTML;
            
            // Restore selection if it still exists, otherwise set to 'all'
            if (currentValue && validRegisteredCourses.includes(currentValue)) {
                courseFilter.value = currentValue;
            } else {
                courseFilter.value = 'all';
            }
        }
    }
    
    // Show/hide materials section based on registered courses
    const materialsSection = document.getElementById('materialsSection');
    const noCoursesMessage = document.getElementById('noCoursesMessage');
    
    if (validRegisteredCourses.length === 0) {
        if (materialsSection) materialsSection.style.display = 'none';
        if (noCoursesMessage) noCoursesMessage.style.display = 'block';
    } else {
        if (materialsSection) materialsSection.style.display = 'block';
        if (noCoursesMessage) noCoursesMessage.style.display = 'none';
    }
    
    isUpdating = false;
}

// Make registerForCourse globally accessible
window.registerForCourse = async function() {
    const courseSelect = document.getElementById('registerCourseSelect');
    if (!courseSelect) {
        alert('Course selection dropdown not found');
        return;
    }
    
    const selectedCourse = courseSelect.value.trim();
    
    if (!selectedCourse) {
        alert('Please select a course to register');
        return;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.class) {
        alert('User information not found. Please log in again.');
        return;
    }
    
    // Validate that the course is valid for this class
    const validCoursesForClass = getCoursesForClass(currentUser.class);
    if (!validCoursesForClass.includes(selectedCourse)) {
        alert('This course is not available for your class. Please select a valid course.');
        return;
    }
    
    const courses = currentUser.courses || [];
    
    // Check if already registered
    if (courses.includes(selectedCourse)) {
        alert('You are already registered for this course');
        populateCourseRegistrationDropdown(); // Refresh dropdown
        return;
    }
    
    // Add course to user's courses
    courses.push(selectedCourse);
    currentUser.courses = courses;
    
    // Update in Supabase first, fallback to localStorage
    let updated = false;
    if (typeof updateUserInSupabase === 'function') {
        try {
            updated = await updateUserInSupabase(currentUser.id, { courses: courses });
            if (updated) {
                setCurrentUser(currentUser);
            }
        } catch (err) {
            console.error('Supabase update error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!updated) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            setCurrentUser(currentUser);
        } else {
            alert('Error: User not found in system');
            return;
        }
    }
    
    // Reset dropdown and repopulate
    courseSelect.value = '';
    populateCourseRegistrationDropdown();
    
    // Reload UI (update student info directly to prevent blinking)
    loadRegisteredCourses();
    loadMaterials();
    updateProgress();
    
    // Update student info text directly (not via function to prevent repeated calls)
    // Update student info text directly (with check to prevent blinking)
    const studentInfoEl = document.getElementById('studentInfo');
    if (studentInfoEl) {
        const courses = currentUser.courses || [];
        const coursesText = courses.length > 0 
            ? `Registered Courses: ${courses.length}` 
            : 'No courses registered yet';
        const newText = `Welcome, ${currentUser.name}. Class: ${currentUser.class || 'N/A'} | ${coursesText}`;
        
        // Only update if text changed
        if (studentInfoEl.textContent !== newText) {
            studentInfoEl.textContent = newText;
            lastStudentInfoText = newText;
        }
    }
    
    alert('Successfully registered for ' + selectedCourse + '!');
};

function unregisterFromCourse(course) {
    if (!confirm(`Are you sure you want to unregister from ${course}?`)) {
        return;
    }
    
    const currentUser = getCurrentUser();
    const courses = currentUser.courses || [];
    
    // Remove course
    currentUser.courses = courses.filter(c => c !== course);
    
    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        setCurrentUser(currentUser);
    }
    
    // Reload UI (without updating student info text to prevent blinking)
    loadRegisteredCourses();
    loadMaterials();
    updateProgress();
    // Update student info text only once, not repeatedly
    // Update student info text directly (with check to prevent blinking)
    const studentInfoEl = document.getElementById('studentInfo');
    if (studentInfoEl) {
        const courses = currentUser.courses || [];
        const coursesText = courses.length > 0 
            ? `Registered Courses: ${courses.length}` 
            : 'No courses registered yet';
        const newText = `Welcome, ${currentUser.name}. Class: ${currentUser.class || 'N/A'} | ${coursesText}`;
        
        // Only update if text changed
        if (studentInfoEl.textContent !== newText) {
            studentInfoEl.textContent = newText;
            lastStudentInfoText = newText;
        }
    }
    
    alert('Unregistered from ' + course);
}

async function loadMaterials() {
    if (isUpdating) return; // Prevent concurrent updates
    isUpdating = true;
    
    const currentUser = getCurrentUser();
    const registeredCourses = currentUser.courses || [];
    
    // If no courses registered, don't show materials
    if (registeredCourses.length === 0) {
        isUpdating = false;
        return;
    }
    
    // Try Supabase first, fallback to localStorage
    let allMaterials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            allMaterials = await getMaterialsFromSupabase({ class: currentUser.class });
        } catch (err) {
            console.error('Supabase load error:', err);
        }
    }
    
    // Fallback to localStorage
    if (allMaterials.length === 0) {
        allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    // Get progress (try Supabase first)
    let userProgress = {};
    if (typeof getUserProgressFromSupabase === 'function') {
        try {
            userProgress = await getUserProgressFromSupabase(currentUser.id);
        } catch (err) {
            const progress = JSON.parse(localStorage.getItem('progress') || '{}');
            userProgress = progress[currentUser.id] || {};
        }
    } else {
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        userProgress = progress[currentUser.id] || {};
    }
    
    // Filter materials for this student's class and registered courses
    let materials = allMaterials.filter(m => 
        m.class === currentUser.class && 
        registeredCourses.includes(m.course)
    );
    
    // Apply course filter
    const courseFilter = document.getElementById('courseFilter')?.value || 'all';
    if (courseFilter !== 'all') {
        materials = materials.filter(m => m.course === courseFilter);
    }
    
    // Apply category filter
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    if (categoryFilter !== 'all') {
        materials = materials.filter(m => m.category === categoryFilter);
    }
    
    // Update category filter options
    updateCategoryFilter(allMaterials.filter(m => 
        m.class === currentUser.class && 
        registeredCourses.includes(m.course)
    ));
    
    const materialsList = document.getElementById('materialsList');
    if (!materialsList) return;
    
    if (materials.length === 0) {
        const emptyHTML = '<p class="empty-state">No learning materials available for your registered courses yet</p>';
        if (materialsList.innerHTML !== emptyHTML) {
            materialsList.innerHTML = emptyHTML;
            lastMaterialsHTML = emptyHTML;
        }
        return;
    }
    
    // Sort by sequence number, then by upload date
    materials.sort((a, b) => {
        const seqA = a.sequence || 999;
        const seqB = b.sequence || 999;
        if (seqA !== seqB) return seqA - seqB;
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
    });
    
    // Generate new HTML
    const newHTML = materials.map(material => {
        const isCompleted = userProgress[material.id] === true;
        return `
            <div class="material-item ${isCompleted ? 'completed' : ''}">
                <div class="material-header">
                    <div>
                        <div class="material-title">
                            ${material.sequence ? `<span style="color: var(--text-color); opacity: 0.7; font-weight: normal; font-size: 0.9em;">Module ${material.sequence}: </span>` : ''}
                            ${material.title}
                        </div>
                        <div class="material-meta">
                            <span>📚 ${material.course}</span>
                            ${material.category ? `<span>📁 ${material.category}</span>` : ''}
                            ${material.isFile ? `<span>📎 ${material.fileName || 'File'}</span>` : ''}
                            <span>📅 ${formatDate(material.uploadedAt)}</span>
                            <span class="badge badge-${material.type}">${material.isFile ? 'FILE' : material.type.toUpperCase()}</span>
                            ${isCompleted ? '<span class="badge badge-completed">✓ Completed</span>' : ''}
                        </div>
                    </div>
                </div>
                ${material.description ? `<div class="material-description">${material.description}</div>` : ''}
                <div class="material-actions">
                    <button onclick="viewMaterial('${material.id}')" class="btn btn-primary">View Material</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Only update if content changed to prevent blinking
    if (newHTML !== lastMaterialsHTML) {
        materialsList.innerHTML = newHTML;
        lastMaterialsHTML = newHTML;
    }
    
    isUpdating = false;
}

function updateCategoryFilter(materials) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const categories = [...new Set(materials.map(m => m.category).filter(c => c))];
    const currentValue = categoryFilter.value;
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    if (currentValue && categories.includes(currentValue)) {
        categoryFilter.value = currentValue;
    }
}

async function viewMaterial(materialId) {
    currentMaterialId = materialId; // Store for markAsCompleted function
    
    // Try Supabase first, fallback to localStorage
    let materials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            materials = await getMaterialsFromSupabase({});
        } catch (err) {
            materials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    const material = materials.find(m => m.id === materialId);
    
    if (!material) {
        alert('Material not found');
        return;
    }
    
    const modal = document.getElementById('materialModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const completeBtn = document.getElementById('completeBtn');
    
    modalTitle.textContent = material.title;
    
    // Display content based on type
    let contentHtml = '';
    
    // Check if this is an uploaded file
    if (material.isFile && material.content) {
        const fileType = material.fileType || '';
        const fileName = material.fileName || 'download';
        
        // Detect file type from extension if MIME type is missing
        let detectedType = fileType;
        if (!detectedType && fileName) {
            const ext = fileName.split('.').pop().toLowerCase();
            const typeMap = {
                'pdf': 'application/pdf',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'bmp': 'image/bmp',
                'webp': 'image/webp',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'txt': 'text/plain'
            };
            detectedType = typeMap[ext] || 'application/octet-stream';
        }
        
        // Ensure content is a valid data URL
        let fileDataUrl = material.content;
        if (!fileDataUrl.startsWith('data:')) {
            // If it's base64 without prefix, add the appropriate prefix
            if (detectedType) {
                fileDataUrl = `data:${detectedType};base64,${material.content}`;
            } else {
                fileDataUrl = `data:application/octet-stream;base64,${material.content}`;
            }
        }
        
        // Display based on exact file type
        if (detectedType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
            // Display PDF inline in iframe
            contentHtml = `
                <div style="margin-bottom: 15px;">
                    <strong>📄 PDF Document:</strong> ${fileName}
                    <button onclick="downloadFile('${materialId}')" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 15px; font-size: 14px;">Download PDF</button>
                </div>
                <iframe src="${fileDataUrl}" type="application/pdf" style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 5px;" frameborder="0"></iframe>
                <p style="margin-top: 10px; color: #666; font-size: 12px;">If PDF doesn't display, click Download PDF button above.</p>
            `;
        } else if (detectedType.startsWith('image/')) {
            // Display images inline - preserve exact image format
            contentHtml = `
                <div style="margin-bottom: 15px;">
                    <strong>🖼️ Image (${detectedType}):</strong> ${fileName}
                    <button onclick="downloadFile('${materialId}')" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 15px; font-size: 14px;">Download Image</button>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <img src="${fileDataUrl}" alt="${fileName}" style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                </div>
            `;
        } else {
            // For other file types (Word, PowerPoint, etc.), provide download link
            contentHtml = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📎</div>
                    <h3>${fileName}</h3>
                    <p class="material-description"><strong>File Type:</strong> ${detectedType || 'Unknown'}</p>
                    <p class="material-description" style="margin-top: 10px;">Click the button below to download the file in its original format.</p>
                    <button onclick="downloadFile('${materialId}')" class="btn btn-primary" style="margin-top: 20px;">Download File</button>
                </div>
            `;
        }
    } else if (material.type === 'pdf') {
        // Legacy PDF type (text content) - provide download option
        contentHtml = `
            <div style="margin-bottom: 15px;">
                <button onclick="downloadTextMaterial('${materialId}', 'pdf')" class="btn btn-primary" style="padding: 8px 20px; font-size: 14px;">
                    📥 Download as PDF
                </button>
            </div>
            <p><strong>PDF Document:</strong></p>
            <div style="white-space: pre-wrap; line-height: 1.8; padding: 15px; background: #f9f9f9; border-radius: 5px;">${material.content}</div>
        `;
    } else if (material.type === 'video') {
        contentHtml = `
            <div style="margin-bottom: 15px;">
                <button onclick="downloadTextMaterial('${materialId}', 'txt')" class="btn btn-primary" style="padding: 8px 20px; font-size: 14px;">
                    📥 Download Video Info as Text
                </button>
            </div>
            <p><strong>Video Content:</strong></p>
            <div style="white-space: pre-wrap; line-height: 1.8; padding: 15px; background: #f9f9f9; border-radius: 5px;">${material.content}</div>
        `;
    } else if (material.type === 'link') {
        contentHtml = `
            <div style="margin-bottom: 15px;">
                <button onclick="downloadTextMaterial('${materialId}', 'txt')" class="btn btn-primary" style="padding: 8px 20px; font-size: 14px;">
                    📥 Download Link Info as Text
                </button>
            </div>
            <p><strong>External Link:</strong></p>
            <p><a href="${material.content}" target="_blank" style="color: var(--primary-color); font-size: 16px; word-break: break-all;">${material.content}</a></p>
            <p class="material-description">Click the link above to open in a new tab, or download the link information using the button above.</p>
        `;
    } else if (material.type === 'text') {
        contentHtml = `
            <div style="margin-bottom: 15px;">
                <button onclick="downloadTextMaterial('${materialId}')" class="btn btn-primary" style="padding: 8px 20px; font-size: 14px;">
                    📥 Download as Text File
                </button>
            </div>
            <div style="white-space: pre-wrap; line-height: 1.8; padding: 15px; background: #f9f9f9; border-radius: 5px;">${material.content}</div>
        `;
    }
    
    if (material.description) {
        contentHtml = `<p class="material-description"><strong>Description:</strong> ${material.description}</p>` + contentHtml;
    }
    
    modalBody.innerHTML = contentHtml;
    
    // Check if already completed
    const currentUser = getCurrentUser();
    const progress = JSON.parse(localStorage.getItem('progress') || '{}');
    const userProgress = progress[currentUser.id] || {};
    const isCompleted = userProgress[materialId] === true;
    
    if (isCompleted) {
        completeBtn.textContent = '✓ Already Completed';
        completeBtn.disabled = true;
        completeBtn.classList.remove('btn-success');
        completeBtn.classList.add('btn-secondary');
    } else {
        completeBtn.textContent = 'Mark as Completed';
        completeBtn.disabled = false;
        completeBtn.classList.remove('btn-secondary');
        completeBtn.classList.add('btn-success');
    }
    
    modal.style.display = 'block';
}

async function markAsCompleted() {
    if (!currentMaterialId) {
        alert('Error: No material selected');
        return;
    }
    
    const materialId = currentMaterialId;
    const currentUser = getCurrentUser();
    
    // Try Supabase first
    let success = false;
    if (typeof markMaterialCompletedInSupabase === 'function') {
        try {
            success = await markMaterialCompletedInSupabase(currentUser.id, materialId);
        } catch (err) {
            console.error('Supabase progress error:', err);
        }
    }
    
    // Fallback to localStorage
    if (!success) {
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        if (!progress[currentUser.id]) {
            progress[currentUser.id] = {};
        }
        progress[currentUser.id][materialId] = true;
        localStorage.setItem('progress', JSON.stringify(progress));
    }
    
    // Update UI
    loadMaterials();
    updateProgress();
    closeMaterialModal();
    
    alert('Material marked as completed!');
}

function closeMaterialModal() {
    document.getElementById('materialModal').style.display = 'none';
    currentMaterialId = null; // Clear current material ID
}

function filterMaterials() {
    loadMaterials();
}

// Store last progress values to prevent unnecessary updates
let lastProgress = { total: -1, completed: -1, percentage: -1 };

async function updateProgress() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const registeredCourses = currentUser.courses || [];
    
    // Get materials (try Supabase first)
    let allMaterials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            allMaterials = await getMaterialsFromSupabase({ class: currentUser.class });
        } catch (err) {
            allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    // Get progress (try Supabase first)
    let userProgress = {};
    if (typeof getUserProgressFromSupabase === 'function') {
        try {
            userProgress = await getUserProgressFromSupabase(currentUser.id);
        } catch (err) {
            const progress = JSON.parse(localStorage.getItem('progress') || '{}');
            userProgress = progress[currentUser.id] || {};
        }
    } else {
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        userProgress = progress[currentUser.id] || {};
    }
    
    // Filter materials for this student's registered courses
    const materials = allMaterials.filter(m => 
        m.class === currentUser.class && 
        registeredCourses.includes(m.course)
    );
    
    const totalMaterials = materials.length;
    const completedMaterials = materials.filter(m => userProgress[m.id] === true).length;
    const progressPercentage = totalMaterials > 0 
        ? Math.round((completedMaterials / totalMaterials) * 100) 
        : 0;
    
    // Only update if values changed
    if (totalMaterials !== lastProgress.total) {
        const el = document.getElementById('totalMaterials');
        if (el) el.textContent = totalMaterials;
        lastProgress.total = totalMaterials;
    }
    
    if (completedMaterials !== lastProgress.completed) {
        const el = document.getElementById('completedMaterials');
        if (el) el.textContent = completedMaterials;
        lastProgress.completed = completedMaterials;
    }
    
    if (progressPercentage !== lastProgress.percentage) {
        const el = document.getElementById('progressPercentage');
        if (el) el.textContent = progressPercentage + '%';
        lastProgress.percentage = progressPercentage;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Download file function - preserves exact file format
async function downloadFile(materialId) {
    // Try Supabase first, fallback to localStorage
    let materials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            materials = await getMaterialsFromSupabase({});
        } catch (err) {
            materials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    const material = materials.find(m => m.id === materialId);
    
    if (!material) {
        alert('Material not found');
        return;
    }
    
    // Check if file is stored in Supabase Storage (has file_url)
    if (material.file_url) {
        // Download from Supabase Storage URL
        try {
            const link = document.createElement('a');
            link.href = material.file_url;
            link.download = material.fileName || material.title || 'download';
            link.target = '_blank'; // Open in new tab if download fails
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        } catch (err) {
            console.error('Error downloading from Supabase Storage:', err);
            // Fall through to try content-based download
        }
    }
    
    // If not a file or no content, can't download
    if (!material.isFile || !material.content) {
        alert('File content not available for download');
        return;
    }
    
    const fileName = material.fileName || 'download';
    const fileType = material.fileType || '';
    let fileData = material.content;
    
    // Ensure data URL format is correct
    if (!fileData.startsWith('data:')) {
        // If it's base64 without prefix, add the appropriate prefix
        if (fileType) {
            fileData = `data:${fileType};base64,${material.content}`;
        } else {
            // Detect from file extension
            const ext = fileName.split('.').pop().toLowerCase();
            const typeMap = {
                'pdf': 'application/pdf',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'txt': 'text/plain'
            };
            const detectedType = typeMap[ext] || 'application/octet-stream';
            fileData = `data:${detectedType};base64,${material.content}`;
        }
    }
    
    // Create download link with proper file name and type
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName; // Preserve original file name
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download text-based materials as text files
async function downloadTextMaterial(materialId, fileExtension = 'txt') {
    // Try Supabase first, fallback to localStorage
    let materials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            materials = await getMaterialsFromSupabase({});
        } catch (err) {
            materials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    const material = materials.find(m => m.id === materialId);
    
    if (!material || !material.content) {
        alert('Material content not found');
        return;
    }
    
    // Create text content with material details
    let textContent = `Material: ${material.title}\n`;
    if (material.description) {
        textContent += `Description: ${material.description}\n`;
    }
    textContent += `Course: ${material.course}\n`;
    textContent += `Class: ${material.class}\n`;
    if (material.category) {
        textContent += `Category: ${material.category}\n`;
    }
    textContent += `\n--- Content ---\n\n${material.content}`;
    
    // Create blob and download
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Make download functions globally accessible
window.downloadFile = downloadFile;
window.downloadTextMaterial = downloadTextMaterial;

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('materialModal');
    if (event.target === modal) {
        closeMaterialModal();
    }
}

