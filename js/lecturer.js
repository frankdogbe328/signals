// Lecturer Portal JavaScript
// Last updated: 2026-01-19 - Fixed material upload ReferenceError

// Populate subject dropdown for lecturer registration
function populateLecturerSubjectDropdown() {
    const classSelect = document.getElementById('lecturerClassSelect').value;
    const subjectSelect = document.getElementById('lecturerSubjectSelect');
    
    if (!classSelect) {
        subjectSelect.innerHTML = '<option value="">Select Class First</option>';
        return;
    }
    
    const currentUser = getCurrentUser();
    const registeredSubjects = currentUser.courses || [];
    const availableSubjects = getCoursesForClass(classSelect);
    
    // Filter out already registered subjects
    const unregisteredSubjects = availableSubjects.filter(subject => !registeredSubjects.includes(subject));
    
    if (unregisteredSubjects.length === 0) {
        subjectSelect.innerHTML = '<option value="">No subjects available or all registered</option>';
    } else {
        subjectSelect.innerHTML = '<option value="">Select a subject</option>' +
            unregisteredSubjects.map(subject => `<option value="${subject}">${subject}</option>`).join('');
    }
}

// Register lecturer for a subject
async function registerLecturerForSubject() {
    // Authorization check
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        if (typeof showError === 'function') {
            showError('You must be logged in as a lecturer to register for subjects.', 'Authorization Required');
        } else {
            alert('You must be logged in as a lecturer to register for subjects.');
        }
        return;
    }
    
    const classSelect = document.getElementById('lecturerClassSelect').value;
    const subjectSelect = document.getElementById('lecturerSubjectSelect');
    const selectedSubject = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(subjectSelect.value.trim()) : subjectSelect.value.trim();
    
    if (!classSelect || !selectedSubject) {
        if (typeof showError === 'function') {
            showError('Please select both class and subject', 'Missing Information');
        } else {
            alert('Please select both class and subject');
        }
        return;
    }
    
    // Validate that the subject is valid for this class
    const validSubjectsForClass = getCoursesForClass(classSelect);
    if (!validSubjectsForClass.includes(selectedSubject)) {
        if (typeof showError === 'function') {
            showError('This subject is not available for the selected class.', 'Invalid Subject');
        } else {
            alert('This subject is not available for the selected class.');
        }
        return;
    }
    
    const courses = currentUser.courses || [];
    
    // Check if already registered
    if (courses.includes(selectedSubject)) {
        if (typeof showInfo === 'function') {
            showInfo('You are already registered for this subject', 'Already Registered');
        } else {
            alert('You are already registered for this subject');
        }
        populateLecturerSubjectDropdown();
        return;
    }
    
    // Add subject to lecturer's courses
    if (!courses.includes(selectedSubject)) {
        courses.push(selectedSubject);
    }
    
    currentUser.courses = courses;
    
    // Update in Supabase first, fallback to localStorage
    let updated = false;
    if (typeof updateUserInSupabase === 'function') {
        try {
            const updatedUser = await updateUserInSupabase(currentUser.id, { courses: courses });
            if (updatedUser) {
                currentUser.courses = updatedUser.courses || courses;
                setCurrentUser(currentUser);
                updated = true;
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
        }
    }
    
    // Refresh current user from Supabase to ensure we have latest data
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient && currentUser.id) {
        try {
            const { data: refreshedUser, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (!error && refreshedUser) {
                setCurrentUser(refreshedUser);
                console.log('User refreshed from Supabase:', refreshedUser.courses);
            }
        } catch (err) {
            console.error('Error refreshing user:', err);
        }
    }
    
    // Reset dropdowns (but keep class selected so they can register more subjects from same class)
    subjectSelect.value = '';
    populateLecturerSubjectDropdown(); // Refresh to show remaining unregistered subjects
    
    // Small delay to ensure state is updated before reloading UI
    setTimeout(() => {
        // Reload UI
        loadLecturerRegisteredSubjects();
        updateCoursesForLecturer(); // Update upload form dropdown
        loadMaterials(); // Refresh materials list
    }, 100);
    
    const className = formatClassName(classSelect);
    if (typeof showSuccess === 'function') {
        showSuccess(`Successfully registered for ${selectedSubject} in ${className}!`, 'Registration Successful');
    } else {
        alert(`Successfully registered for ${selectedSubject} in ${className}!`);
    }
}

// Helper function to find which classes a subject belongs to
function findClassesForSubject(subject) {
    const allClasses = [
        'signals-basic', 'signals-b-iii-b-ii', 'signals-b-ii-b-i',
        'superintendent', 'pre-qualifying',
        'regimental-basic', 'regimental-b-iii-b-ii', 'regimental-b-ii-b-i',
        'rso-rsi', 'electronic-warfare-course', 'tactical-drone-course'
    ];
    
    const classesWithSubject = [];
    allClasses.forEach(classId => {
        const subjects = getCoursesForClass(classId);
        if (subjects.includes(subject)) {
            classesWithSubject.push(classId);
        }
    });
    return classesWithSubject;
}

// Helper function to format class name for display
function formatClassName(classId) {
    // Comprehensive class name mapping - ensures capital I throughout for Signals and Regimental classes
    const classNames = {
        // New class format (current)
        'signals-basic': 'SIGNALS BASIC',
        'signals-b-iii-b-ii': 'SIGNALS B III – B II',  // Capital I throughout
        'signals-b-ii-b-i': 'SIGNALS B II – B I',  // Capital I throughout
        'superintendent': 'SUPERINTENDENT',
        'pre-qualifying': 'PRE-QUALIFYING',
        'regimental-basic': 'REGIMENTAL BASIC',
        'regimental-b-iii-b-ii': 'REGIMENTAL B III – B II',  // Capital I throughout
        'regimental-b-ii-b-i': 'REGIMENTAL B II – B I',  // Capital I throughout
        'rso-rsi': 'RSO / RSI',
        'electronic-warfare-course': 'ELECTRONIC WARFARE COURSE',
        'tactical-drone-course': 'TACTICAL DRONE COURSE',
        // Old class format (legacy support)
        'signal-basic-beginner': 'Signal Basic - Beginner',
        'signal-basic-ii-intermediate': 'Signal Basic II - Intermediate',  // Capital I
        'signal-basic-i-advanced': 'Signal Basic I - Advanced',  // Capital I
        'regimental-basic-beginner': 'Regimental Basic - Beginner',
        'regimental-basic-ii-intermediate': 'Regimental Basic II - Intermediate',  // Capital I
        'regimental-basic-i-advanced': 'Regimental Basic I - Advanced',  // Capital I
        'electronic-warfare': 'Electronic Warfare',
        'upgrading-telecom': 'Upgrading - Telecom',
        'upgrading-rf': 'Upgrading - RF',
        'drone-operators': 'Practical Drone Operators Course'
    };
    
    // If class ID is in mapping, return it
    if (classNames[classId]) {
        return classNames[classId];
    }
    
    // Fallback: Ensure capital I in roman numerals for Signals and Regimental classes
    let formatted = classId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    // Fix roman numerals: ensure 'i' is capitalized when after 'B' (e.g., "B Ii" → "B II", "B I" → "B I")
    formatted = formatted.replace(/\bB\s+([Ii]{1,3})\b/g, (match, roman) => {
        return 'B ' + roman.toUpperCase(); // Capitalize all I's in roman numerals after B
    });
    return formatted;
}

// Load and display lecturer's registered subjects grouped by class
function loadLecturerRegisteredSubjects() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.log('No current user found');
        return;
    }
    
    const registeredSubjects = currentUser.courses || [];
    const subjectsList = document.getElementById('lecturerRegisteredSubjectsList');
    if (!subjectsList) {
        console.log('Subjects list element not found');
        return;
    }
    
    console.log('Loading registered subjects:', registeredSubjects);
    
    if (registeredSubjects.length === 0) {
        subjectsList.innerHTML = '<p class="empty-state" style="padding: 10px;">No subjects registered. Register for subjects above to manage materials.</p>';
        return;
    }
    
    // Group subjects by class
    const subjectsByClass = {};
    registeredSubjects.forEach(subject => {
        const classes = findClassesForSubject(subject);
        classes.forEach(classId => {
            if (!subjectsByClass[classId]) {
                subjectsByClass[classId] = [];
            }
            if (!subjectsByClass[classId].includes(subject)) {
                subjectsByClass[classId].push(subject);
            }
        });
    });
    
    // Display grouped by class
    let html = '';
    Object.keys(subjectsByClass).sort().forEach(classId => {
        const className = formatClassName(classId);
        const subjects = subjectsByClass[classId];
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #ffffff; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                <h4 style="color: var(--primary-color); margin-bottom: 10px; font-size: 16px; font-weight: 600;">${className}</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${subjects.map(subject => `
                        <span style="display: inline-block; padding: 6px 12px; background: #f8f9fa; border-radius: 5px; font-size: 14px; font-weight: 500; color: var(--text-color);">
                            ${subject}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    subjectsList.innerHTML = html;
}

// Update courses dropdown for lecturer based on selected class (only show registered subjects)
// This allows lecturers to upload materials for any of their registered subjects across all classes
function updateCoursesForLecturer() {
    const classSelect = document.getElementById('classSelect').value;
    const courseSelect = document.getElementById('courseSelect');
    const currentUser = getCurrentUser();
    const registeredSubjects = currentUser.courses || [];
    
    if (!classSelect) {
        courseSelect.innerHTML = '<option value="">Select Class First</option>';
        courseSelect.disabled = true;
        return;
    }
    
    // Get all courses for the selected class
    const allCoursesForClass = getCoursesForClass(classSelect);
    
    // Filter to only show subjects the lecturer is registered for AND that belong to this class
    const availableCourses = allCoursesForClass.filter(course => registeredSubjects.includes(course));
    
    if (availableCourses.length === 0) {
        // Check if lecturer has any registered subjects at all
        if (registeredSubjects.length === 0) {
            courseSelect.innerHTML = '<option value="">No subjects registered. Please register for subjects first.</option>';
        } else {
            // Lecturer has subjects but not for this class
            const lecturerClasses = new Set();
            registeredSubjects.forEach(subject => {
                const classes = findClassesForSubject(subject);
                classes.forEach(c => lecturerClasses.add(c));
            });
            
            if (lecturerClasses.size > 0) {
                const classNames = Array.from(lecturerClasses).map(c => formatClassName(c)).join(', ');
                courseSelect.innerHTML = `<option value="">No registered subjects for this class. Your subjects are in: ${classNames}</option>`;
            } else {
                courseSelect.innerHTML = '<option value="">No registered subjects for this class</option>';
            }
        }
        courseSelect.disabled = true;
    } else {
        courseSelect.innerHTML = '<option value="">Select Subject</option>' +
            availableCourses.map(course => `<option value="${course}">${course}</option>`).join('');
        courseSelect.disabled = false;
    }
}

// Lecturer dashboard functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    let currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Redirect admin to admin portal
    if (currentUser.role === 'admin') {
        window.location.href = 'admin-portal.html';
        return;
    }
    
    // Redirect non-lecturers to login
    if (currentUser.role !== 'lecturer') {
        window.location.href = 'index.html';
        return;
    }
    
    // Refresh user data from Supabase to get latest registered subjects
    // Use the Supabase client directly to get user by ID
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient && currentUser.id) {
        try {
            const { data: refreshedUser, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
            
            if (!error && refreshedUser) {
                setCurrentUser(refreshedUser);
                currentUser = refreshedUser;
                console.log('User data refreshed on dashboard load:', refreshedUser.courses);
            }
        } catch (err) {
            console.error('Error refreshing user on dashboard load:', err);
        }
    }
    
    // Display lecturer name with Welcome
    const lecturerNameEl = document.getElementById('lecturerName');
    const mobileLecturerNameEl = document.getElementById('mobileLecturerName');
    if (lecturerNameEl) {
        lecturerNameEl.textContent = `Welcome, ${currentUser.name}`;
    }
    if (mobileLecturerNameEl) {
        mobileLecturerNameEl.textContent = `Welcome, ${currentUser.name}`;
    }
    
    // Load lecturer's registered subjects (critical - needed immediately)
    loadLecturerRegisteredSubjects();
    
    // Step 1: Load materials (critical - needed for upload form)
    // Use .catch() to prevent unhandled promise rejections
    loadMaterials().catch(err => console.error('Error loading materials:', err));
    
    // Step 1: Defer analytics loading (non-critical - can wait until page is interactive)
    // Analytics is heavy (fetches materials, users, progress) - defer until idle
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadAnalytics().catch(err => console.error('Error loading analytics:', err));
        }, { timeout: 2000 }); // Fallback to setTimeout after 2s if no idle time
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
            loadAnalytics().catch(err => console.error('Error loading analytics:', err));
        }, 500); // Wait 500ms after page load
    }
    
    // Handle upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleMaterialUpload);
    }
});

function handleMaterialTypeChange() {
    const materialType = document.getElementById('materialType').value;
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const contentGroup = document.getElementById('contentGroup');
    const materialContent = document.getElementById('materialContent');
    const materialFile = document.getElementById('materialFile');
    
    if (materialType === 'file') {
        fileUploadGroup.style.display = 'block';
        contentGroup.style.display = 'none';
        materialContent.removeAttribute('required');
        materialFile.setAttribute('required', 'required');
    } else {
        fileUploadGroup.style.display = 'none';
        contentGroup.style.display = 'block';
        materialContent.setAttribute('required', 'required');
        materialFile.removeAttribute('required');
        materialFile.value = ''; // Clear file input
        document.getElementById('filePreview').innerHTML = '';
    }
}

function previewFile() {
    const fileInput = document.getElementById('materialFile');
    const previewDiv = document.getElementById('filePreview');
    
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
        
        if (file.size > 10 * 1024 * 1024) {
            previewDiv.innerHTML = '<p style="color: red;">⚠️ File size exceeds 10MB limit!</p>';
            fileInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileType = file.type || getFileTypeFromName(file.name);
            let previewHTML = `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 3px solid var(--primary-color);">
                    <strong>📎 ${file.name}</strong><br>
                    <small style="color: #666;">Size: ${fileSize} MB | Type: ${fileType}</small>
            `;
            
            // Preview for images
            if (fileType.startsWith('image/')) {
                previewHTML += `<br><img src="${e.target.result}" style="max-width: 200px; margin-top: 10px; border-radius: 5px;">`;
            }
            
            previewHTML += '</div>';
            previewDiv.innerHTML = previewHTML;
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.innerHTML = '';
    }
}

async function handleMaterialUpload(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Validate CSRF token
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        // Ensure token exists
        if (typeof SecurityUtils.addCSRFTokenToForm === 'function') {
            SecurityUtils.addCSRFTokenToForm(form);
        }
        
        if (!SecurityUtils.validateFormCSRFToken(form)) {
            if (typeof showError === 'function') {
                showError('Security token validation failed. Please refresh the page and try again.', 'Security Error');
            } else {
                alert('Security token validation failed. Please refresh the page and try again.');
            }
            return;
        }
    }
    
    // Authorization check
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        if (typeof showError === 'function') {
            showError('You must be logged in as a lecturer to upload materials.', 'Authorization Required');
        } else {
            alert('You must be logged in as a lecturer to upload materials.');
        }
        return;
    }
    
    // Step 2: Cache DOM queries - avoid repeated lookups
    const uploadFormEl = document.getElementById('uploadForm');
    const courseSelectEl = document.getElementById('courseSelect');
    const classSelectEl = document.getElementById('classSelect');
    const titleEl = document.getElementById('materialTitle');
    const typeEl = document.getElementById('materialType');
    const descriptionEl = document.getElementById('materialDescription');
    const categoryEl = document.getElementById('materialCategory');
    const sequenceEl = document.getElementById('materialSequence');
    const submitBtn = document.getElementById('submitBtn');
    
    const course = courseSelectEl.value;
    const classSelect = classSelectEl.value;
    const title = titleEl.value;
    const type = typeEl.value;
    const description = descriptionEl.value;
    const category = categoryEl.value;
    const sequence = parseInt(sequenceEl.value) || 999;
    const originalBtnText = submitBtn.textContent;
    
    // Sanitize inputs
    const sanitizedTitle = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(title) : title.trim();
    const sanitizedDescription = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(description || '') : (description || '').trim();
    const sanitizedCategory = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(category || '') : (category || '').trim();
    
    // Validate title length
    if (sanitizedTitle.length < 3 || sanitizedTitle.length > 200) {
        if (typeof showError === 'function') {
            showError('Material title must be between 3 and 200 characters.', 'Validation Error');
        } else {
            alert('Material title must be between 3 and 200 characters.');
        }
        return;
    }
    
    // Authorization check: Verify lecturer is registered for this subject
    const registeredSubjects = currentUser.courses || [];
    if (registeredSubjects.length > 0 && !registeredSubjects.includes(course)) {
        if (typeof showError === 'function') {
            showError(`You are not registered for the subject "${course}". Please register for this subject first.`, 'Subject Not Registered');
        } else {
            alert(`You are not registered for the subject "${course}". Please register for this subject first.`);
        }
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    
    // Handle file upload
    const materialFile = document.getElementById('materialFile');
    let content = '';
    let fileName = '';
    let fileType = '';
    
    if (type === 'file' && materialFile.files.length > 0) {
        const file = materialFile.files[0];
        
        // Validate file using security utils
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFileSize) {
            if (!SecurityUtils.validateFileSize(file, 50)) { // 50MB limit
                if (typeof showError === 'function') {
                    showError('File size exceeds 50MB limit. Please choose a smaller file.', 'File Too Large');
                } else {
                    alert('❌ File size exceeds 50MB limit. Please choose a smaller file.');
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
        } else {
            // Fallback validation
            if (file.size > 50 * 1024 * 1024) {
                if (typeof showError === 'function') {
                    showError('File size exceeds 50MB limit. Please choose a smaller file.\n\nCurrent file size: ' + 
                              (file.size / (1024 * 1024)).toFixed(2) + ' MB', 'File Too Large');
                } else {
                    alert('❌ File size exceeds 50MB limit. Please choose a smaller file.\n\nCurrent file size: ' + 
                          (file.size / (1024 * 1024)).toFixed(2) + ' MB');
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
        }
        
        // Sanitize filename
        fileName = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeFilename ? 
            SecurityUtils.sanitizeFilename(file.name) : file.name;
        
        // Check file size is reasonable (minimum 1 byte)
        if (file.size === 0) {
            if (typeof showError === 'function') {
                showError('File is empty. Please select a valid file.', 'Invalid File');
            } else {
                alert('❌ File is empty. Please select a valid file.');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }
        
        fileName = file.name;
        fileType = file.type || getFileTypeFromName(fileName);
        
        // Upload file to Supabase Storage
        try {
            submitBtn.textContent = 'Uploading file to storage...';
            
            if (typeof uploadSupabaseFile === 'function') {
                const uploadResult = await uploadSupabaseFile(file, fileName);
                
                if (uploadResult && uploadResult.url) {
                    // File uploaded successfully, save material with storage URL
                    await saveMaterialWithFile(
                        course, 
                        classSelect, 
                        sanitizedTitle, 
                        type, 
                        sanitizedDescription, 
                        sanitizedCategory, 
                        sequence, 
                        null, // No base64 data needed
                        uploadResult.fileName, 
                        fileType,
                        uploadResult.url // Storage URL
                    );
                    
                    // Reset button state
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    return;
                } else {
                    throw new Error('Failed to get file URL from storage');
                }
            } else {
                // Fallback to base64 if Supabase Storage functions not available
                console.warn('Supabase Storage functions not available, falling back to base64 storage');
                submitBtn.textContent = 'Reading file...';
                
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const fileData = e.target.result;
                    await saveMaterialWithFile(course, classSelect, sanitizedTitle, type, sanitizedDescription, sanitizedCategory, sequence, fileData, fileName, fileType, null);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                };
                reader.onerror = function() {
                    if (typeof showError === 'function') {
                        showError('Error reading file. Please try again.', 'File Read Error');
                    } else {
                        alert('Error reading file. Please try again.');
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                };
                reader.readAsDataURL(file);
                return; // Exit early, will continue in callback
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            if (typeof showError === 'function') {
                showError('File upload failed. Please check your internet connection and try again.', 'Upload Error');
            } else {
                alert('File upload failed. Please check your internet connection and try again.');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }
    } else {
        content = document.getElementById('materialContent').value;
        if (!content && type !== 'file') {
            if (typeof showError === 'function') {
                showError('Please provide content or upload a file', 'Missing Content');
            } else {
                alert('Please provide content or upload a file');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }
        
        // Sanitize content
        const sanitizedContent = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
            SecurityUtils.sanitizeInput(content) : content.trim();
        
        // Continue with normal upload (non-file)
        try {
            await saveMaterial(course, classSelect, sanitizedTitle, type, sanitizedContent, sanitizedDescription, sanitizedCategory, sequence);
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        } catch (error) {
            console.error('Error saving material:', error);
            if (typeof showError === 'function') {
                showError('Failed to save material. Please try again.', 'Save Error');
            } else {
                alert('Failed to save material. Please try again.');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

function getFileTypeFromName(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    return typeMap[ext] || 'application/octet-stream';
}

async function saveMaterialWithFile(course, classSelect, title, type, description, category, sequence, fileData, fileName, fileType, fileUrl) {
    const currentUser = getCurrentUser();
    
    // Authorization check: Verify user is a lecturer
    if (!currentUser || currentUser.role !== 'lecturer') {
        const errorMessage = 'You must be logged in as a lecturer to upload materials.';
        if (typeof showError === 'function') {
            showError(errorMessage, 'Authorization Required');
        } else {
            alert(errorMessage);
        }
        return false;
    }
    
    // Authorization check: Verify lecturer is registered for this subject
    const registeredSubjects = currentUser.courses || [];
    if (!registeredSubjects.includes(course)) {
        const errorMessage = `You are not registered for the subject "${course}". Please register for this subject first before uploading materials.`;
        if (typeof showError === 'function') {
            showError(errorMessage, 'Subject Not Registered');
        } else {
            alert(errorMessage);
        }
        return false;
    }
    
    // Step 2: Cache DOM query for this function
    const uploadForm = document.getElementById('uploadForm');
    const editingId = uploadForm ? uploadForm.dataset.editingId : null;
    
    // Use Supabase Storage URL if available, otherwise fall back to base64
    const materialData = {
        course: course,
        class: classSelect,
        title: typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? SecurityUtils.sanitizeInput(title) : title.trim(),
        type: type,
        content: fileUrl ? null : fileData, // Only store base64 if no storage URL
        description: typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? SecurityUtils.sanitizeInput(description || '') : (description || '').trim(),
        category: typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? SecurityUtils.sanitizeInput(category || '') : (category || '').trim(),
        sequence: sequence,
        uploadedBy: currentUser.id, // Use user ID instead of name for better tracking
        isFile: true,
        fileName: typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeFilename ? SecurityUtils.sanitizeFilename(fileName) : fileName,
        fileType: fileType,
        file_url: fileUrl || null // Store Supabase Storage URL
    };
    
    let success = false;
    let errorMessage = '';
    
    // Try Supabase first
    if (typeof createMaterialInSupabase === 'function' && typeof updateMaterialInSupabase === 'function') {
        try {
            if (editingId) {
                // Authorization check for editing: Verify material belongs to lecturer
                const client = getSupabaseClient();
                if (client) {
                    const { data: oldMaterial, error: materialError } = await client
                        .from('materials')
                        .select('uploaded_by')
                        .eq('id', editingId)
                        .single();
                    
                    if (materialError) throw materialError;
                    if (!oldMaterial || oldMaterial.uploaded_by !== currentUser.id) {
                        const errorMsg = 'You do not have permission to edit this material.';
                        if (typeof showError === 'function') {
                            showError(errorMsg, 'Access Denied');
                        } else {
                            alert(errorMsg);
                        }
                        return false;
                    }
                }
                // If editing, delete old file from storage if it exists
                if (fileUrl) {
                    // Get old material to check for old file URL
                    const oldMaterials = await getMaterialsFromSupabase({});
                    const oldMaterial = oldMaterials.find(m => m.id === editingId);
                    if (oldMaterial && oldMaterial.file_url && typeof deleteSupabaseFile === 'function') {
                        try {
                            // Extract path from URL
                            const urlParts = oldMaterial.file_url.split('/');
                            const filePath = urlParts.slice(-2).join('/'); // Get bucket/file path
                            await deleteSupabaseFile('learning-materials', filePath);
                        } catch (deleteError) {
                            console.warn('Could not delete old file from storage:', deleteError);
                        }
                    }
                }
                
                success = await updateMaterialInSupabase(editingId, materialData);
                if (success) {
                    if (typeof showSuccess === 'function') {
                        showSuccess('Material updated successfully!', 'Update Successful');
                    } else {
                        alert('✅ Material updated successfully!');
                    }
                } else {
                    errorMessage = 'Failed to update material in database';
                }
            } else {
                const created = await createMaterialInSupabase(materialData);
                if (created) {
                    success = true;
                    if (typeof showSuccess === 'function') {
                        showSuccess('File uploaded successfully to Supabase Storage!', 'Upload Successful');
                    } else {
                        alert('✅ File uploaded successfully to Supabase Storage!');
                    }
                } else {
                    errorMessage = 'Failed to save material to database';
                }
            }
        } catch (err) {
            console.error('Supabase file save error:', err);
            errorMessage = err.message || 'Database error occurred';
            
            // If upload succeeded but save failed, try to delete the uploaded file
            if (fileUrl && typeof deleteSupabaseFile === 'function') {
                try {
                    const urlParts = fileUrl.split('/');
                    const filePath = urlParts.slice(-2).join('/');
                    await deleteSupabaseFile('learning-materials', filePath);
                } catch (deleteError) {
                    console.warn('Could not clean up uploaded file:', deleteError);
                }
            }
        }
    }
    
    // Fallback to localStorage only if Supabase completely fails
    if (!success && !fileUrl) {
        console.warn('Falling back to localStorage storage');
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const newMaterial = {
            id: editingId || Date.now().toString(),
            ...materialData,
            uploadedAt: new Date().toISOString()
        };
        
        if (editingId) {
            const index = materials.findIndex(m => m.id === editingId);
            if (index !== -1) {
                materials[index] = { ...materials[index], ...newMaterial, id: editingId };
                localStorage.setItem('materials', JSON.stringify(materials));
                if (typeof showInfo === 'function') {
                    showInfo('Material updated (stored locally - Supabase unavailable)', 'Local Storage');
                } else {
                    alert('⚠️ Material updated (stored locally - Supabase unavailable)');
                }
                success = true;
            }
            if (uploadForm) {
                delete uploadForm.dataset.editingId;
            }
            document.getElementById('submitBtn').textContent = 'Upload Material';
            document.getElementById('cancelBtn').style.display = 'none';
        } else {
            materials.push(newMaterial);
            localStorage.setItem('materials', JSON.stringify(materials));
            if (typeof showInfo === 'function') {
                showInfo('File uploaded (stored locally - Supabase unavailable)', 'Local Storage');
            } else {
                alert('⚠️ File uploaded (stored locally - Supabase unavailable)');
            }
            success = true;
        }
    } else if (!success) {
        // Supabase failed but we tried to upload to storage
        alert(`❌ Error: ${errorMessage || 'Failed to save material. Please try again.'}`);
    }
    
    if (success) {
        // Clear editing state if succeeded
        if (editingId && uploadForm) {
            delete uploadForm.dataset.editingId;
            document.getElementById('submitBtn').textContent = 'Upload Material';
            document.getElementById('cancelBtn').style.display = 'none';
        }
        
        // Reset form
        if (uploadForm) {
            uploadForm.reset();
        }
        document.getElementById('fileUploadGroup').style.display = 'none';
        document.getElementById('contentGroup').style.display = 'block';
        document.getElementById('filePreview').innerHTML = '';
        
        // Reload materials and analytics
        loadMaterials();
        if (document.getElementById('analyticsContent')) {
            loadAnalytics();
        }
    }
}

async function saveMaterial(course, classSelect, title, type, content, description, category, sequence) {
    const currentUser = getCurrentUser();
    
    // Authorization check
    if (!currentUser || currentUser.role !== 'lecturer') {
        if (typeof showError === 'function') {
            showError('You must be logged in as a lecturer to save materials.', 'Authorization Required');
        } else {
            alert('You must be logged in as a lecturer to save materials.');
        }
        return false;
    }
    
    // Verify lecturer is registered for this subject
    const registeredSubjects = currentUser.courses || [];
    if (registeredSubjects.length > 0 && !registeredSubjects.includes(course)) {
        if (typeof showError === 'function') {
            showError(`You are not registered for the subject "${course}".`, 'Subject Not Registered');
        } else {
            alert(`You are not registered for the subject "${course}".`);
        }
        return false;
    }
    
    const uploadForm = document.getElementById('uploadForm');
    const editingId = uploadForm ? uploadForm.dataset.editingId : null;
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Upload Material';
    
    const materialData = {
        course: course,
        class: classSelect,
        title: title, // Already sanitized by caller
        type: type,
        content: content, // Already sanitized by caller
        description: description, // Already sanitized by caller
        category: category, // Already sanitized by caller
        sequence: sequence,
        uploadedBy: currentUser.id // Use ID instead of name for better tracking
    };
    
    let success = false;
    let errorMessage = '';
    
    // Try Supabase first
    if (typeof createMaterialInSupabase === 'function' && typeof updateMaterialInSupabase === 'function') {
        try {
            if (editingId) {
                // Authorization check for editing: Verify material belongs to lecturer
                const client = getSupabaseClient();
                if (client) {
                    const { data: oldMaterial, error: materialError } = await client
                        .from('materials')
                        .select('uploaded_by')
                        .eq('id', editingId)
                        .single();
                    
                    if (materialError) throw materialError;
                    if (!oldMaterial || oldMaterial.uploaded_by !== currentUser.id) {
                        if (typeof showError === 'function') {
                            showError('You do not have permission to edit this material.', 'Access Denied');
                        } else {
                            alert('You do not have permission to edit this material.');
                        }
                        return false;
                    }
                }
                
                success = await updateMaterialInSupabase(editingId, materialData);
                if (success) {
                    if (typeof showSuccess === 'function') {
                        showSuccess('Material updated successfully!', 'Update Successful');
                    } else {
                        alert('✅ Material updated successfully!');
                    }
                } else {
                    errorMessage = 'Failed to update material in database';
                }
            } else {
                const created = await createMaterialInSupabase(materialData);
                if (created) {
                    success = true;
                    if (typeof showSuccess === 'function') {
                        showSuccess('Material uploaded successfully!', 'Upload Successful');
                    } else {
                        if (typeof showSuccess === 'function') {
                            showSuccess('Material uploaded successfully!', 'Upload Successful');
                        } else {
                            alert('✅ Material uploaded successfully!');
                        }
                    }
                } else {
                    errorMessage = 'Failed to save material to database';
                }
            }
        } catch (err) {
            console.error('Supabase save error:', err);
            errorMessage = err.message || 'Database error occurred';
        }
    }
    
    // Fallback to localStorage
    if (!success) {
        console.warn('Falling back to localStorage storage');
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const newMaterial = {
            id: editingId || Date.now().toString(),
            ...materialData,
            uploadedAt: new Date().toISOString()
        };
        
        if (editingId) {
            const index = materials.findIndex(m => m.id === editingId);
            if (index !== -1) {
                materials[index] = { ...materials[index], ...newMaterial, id: editingId };
                localStorage.setItem('materials', JSON.stringify(materials));
                if (typeof showInfo === 'function') {
                    showInfo('Material updated (stored locally - Supabase unavailable)', 'Local Storage');
                } else {
                    alert('⚠️ Material updated (stored locally - Supabase unavailable)');
                }
                success = true;
            }
            if (uploadForm) {
                delete uploadForm.dataset.editingId;
            }
            if (submitBtn) {
                submitBtn.textContent = 'Upload Material';
            }
            document.getElementById('cancelBtn').style.display = 'none';
        } else {
            materials.push(newMaterial);
            localStorage.setItem('materials', JSON.stringify(materials));
            if (typeof showInfo === 'function') {
                showInfo('Material uploaded (stored locally - Supabase unavailable)', 'Local Storage');
            } else {
                alert('⚠️ Material uploaded (stored locally - Supabase unavailable)');
            }
            success = true;
        }
    } else if (!success) {
        alert(`❌ Error: ${errorMessage || 'Failed to save material. Please try again.'}`);
    }
    
    // Reset button state
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
    
    if (success) {
        // Clear editing state
        if (editingId && uploadForm) {
            delete uploadForm.dataset.editingId;
            if (submitBtn) {
                submitBtn.textContent = 'Upload Material';
            }
            document.getElementById('cancelBtn').style.display = 'none';
        }
        
        // Reset form
        if (uploadForm) {
            uploadForm.reset();
        }
        document.getElementById('fileUploadGroup').style.display = 'none';
        document.getElementById('contentGroup').style.display = 'block';
        document.getElementById('filePreview').innerHTML = '';
        
        // Reload materials and analytics
        loadMaterials();
        if (document.getElementById('analyticsContent')) {
            loadAnalytics();
        }
    }
}

async function loadAnalytics() {
    // Get current lecturer's registered subjects
    const currentUser = getCurrentUser();
    const registeredSubjects = currentUser.courses || [];
    
    let materials = [];
    let users = [];
    let progress = {};
    
    // Try Supabase first
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            materials = await getMaterialsFromSupabase({});
        } catch (err) {
            materials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    // Filter materials to only show courses/subjects the lecturer is registered for
    if (registeredSubjects.length > 0) {
        materials = materials.filter(m => registeredSubjects.includes(m.course));
    }
    
    // Get users and progress
    if (typeof getUsersFromSupabase === 'function') {
        try {
            users = await getUsersFromSupabase({});
        } catch (err) {
            users = JSON.parse(localStorage.getItem('users') || '[]');
        }
    } else {
        users = JSON.parse(localStorage.getItem('users') || '[]');
    }
    
    if (typeof getProgressFromSupabase === 'function') {
        try {
            const progressData = await getProgressFromSupabase({});
            // Convert array to object format
            progress = {};
            progressData.forEach(p => {
                if (!progress[p.user_id]) progress[p.user_id] = {};
                progress[p.user_id][p.material_id] = true;
            });
        } catch (err) {
            progress = JSON.parse(localStorage.getItem('progress') || '{}');
        }
    } else {
        progress = JSON.parse(localStorage.getItem('progress') || '{}');
    }
    
    const allStudents = users.filter(u => u.role === 'student');
    const activeClasses = [...new Set(materials.map(m => m.class))];
    
    // Filter students to only count those registered for subjects the lecturer teaches
    // A student is relevant if they are registered for at least one subject the lecturer teaches
    const relevantStudents = allStudents.filter(student => {
        if (!student.courses || student.courses.length === 0) return false;
        
        // Check if student is registered for any subject the lecturer teaches
        const studentHasLecturerSubject = student.courses.some(studentSubject => 
            registeredSubjects.includes(studentSubject)
        );
        
        // Also check if student's class has materials from lecturer
        const studentClassHasMaterials = materials.some(m => 
            m.class === student.class && student.courses.includes(m.course)
        );
        
        return studentHasLecturerSubject && studentClassHasMaterials;
    });
    
    // Calculate overall completion rate (only for relevant students)
    let totalCompletions = 0;
    let totalPossible = 0;
    
    relevantStudents.forEach(student => {
        const studentMaterials = materials.filter(m => 
            m.class === student.class && student.courses && student.courses.includes(m.course)
        );
        totalPossible += studentMaterials.length;
        const studentProgress = progress[student.id] || {};
        totalCompletions += studentMaterials.filter(m => studentProgress[m.id]).length;
    });
    
    const overallCompletion = totalPossible > 0 
        ? Math.round((totalCompletions / totalPossible) * 100) 
        : 0;
    
    // Update overview
    document.getElementById('totalMaterialsCount').textContent = materials.length;
    document.getElementById('totalStudentsCount').textContent = relevantStudents.length;
    document.getElementById('overallCompletion').textContent = overallCompletion + '%';
    document.getElementById('activeClassesCount').textContent = activeClasses.length;
    
    // Load class progress (use relevant students only)
    loadClassProgress(materials, relevantStudents, progress);
    
    // Load material statistics (use relevant students only)
    loadMaterialStats(materials, relevantStudents, progress);
}

function loadClassProgress(materials, students, progress) {
    const classProgressContent = document.getElementById('classProgressContent');
    const classes = [
        'signal-basic-beginner', 'signal-basic-ii-intermediate', 'signal-basic-i-advanced',
        'regimental-basic-beginner', 'regimental-basic-ii-intermediate', 'regimental-basic-i-advanced',
        'electronic-warfare',
        'upgrading-telecom', 'upgrading-rf',
        'drone-operators'
    ];
    
    let html = '<div class="class-progress-grid">';
    
    classes.forEach(classId => {
        const classMaterials = materials.filter(m => m.class === classId);
        const classStudents = students.filter(s => s.class === classId);
        
        if (classMaterials.length === 0 && classStudents.length === 0) {
            html += `
                <div class="class-progress-card">
                    <h4>${formatClassName(classId)}</h4>
                    <p class="empty-state">No materials or students</p>
                </div>
            `;
            return;
        }
        
        let classCompletions = 0;
        let classTotal = 0;
        
        classStudents.forEach(student => {
            // Support both old format (course) and new format (courses array)
            const studentCourses = student.courses || (student.course ? [student.course] : []);
            const studentMaterials = classMaterials.filter(m => studentCourses.includes(m.course));
            classTotal += studentMaterials.length;
            const studentProgress = progress[student.id] || {};
            classCompletions += studentMaterials.filter(m => studentProgress[m.id]).length;
        });
        
        const classCompletionRate = classTotal > 0 
            ? Math.round((classCompletions / classTotal) * 100) 
            : 0;
        
        html += `
            <div class="class-progress-card">
                <h4>${formatClassName(classId)}</h4>
                <div class="progress-details">
                    <div class="progress-stat">
                        <span class="stat-label">Materials:</span>
                        <span class="stat-value">${classMaterials.length}</span>
                    </div>
                    <div class="progress-stat">
                        <span class="stat-label">Students:</span>
                        <span class="stat-value">${classStudents.length}</span>
                    </div>
                    <div class="progress-stat">
                        <span class="stat-label">Completion:</span>
                        <span class="stat-value">${classCompletionRate}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${classCompletionRate}%"></div>
                    </div>
                </div>
                <div class="student-list" style="margin-top: 15px;">
                    <strong>Student Progress:</strong>
                    ${classStudents.length === 0 ? '<p class="empty-state">No students in this class</p>' : ''}
                    ${classStudents.map(student => {
                        // Support both old format (course) and new format (courses array)
                        const studentCourses = student.courses || (student.course ? [student.course] : []);
                        const studentMaterials = classMaterials.filter(m => studentCourses.includes(m.course));
                        const studentProgress = progress[student.id] || {};
                        const completed = studentMaterials.filter(m => studentProgress[m.id]).length;
                        const total = studentMaterials.length;
                        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return `
                            <div class="student-progress-item">
                                <span>${student.name}</span>
                                <span>${completed}/${total} (${rate}%)</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    classProgressContent.innerHTML = html;
}

function loadMaterialStats(materials, students, progress) {
    const materialStatsContent = document.getElementById('materialStatsContent');
    
    if (materials.length === 0) {
        materialStatsContent.innerHTML = '<p class="empty-state">No materials uploaded yet</p>';
        return;
    }
    
    // Calculate stats for each material
    const materialStats = materials.map(material => {
        // Support both old format (course) and new format (courses array)
        const relevantStudents = students.filter(s => 
            s.class === material.class && 
            (s.courses ? s.courses.includes(material.course) : (s.course === material.course))
        );
        
        let completed = 0;
        relevantStudents.forEach(student => {
            const studentProgress = progress[student.id] || {};
            if (studentProgress[material.id]) {
                completed++;
            }
        });
        
        const completionRate = relevantStudents.length > 0 
            ? Math.round((completed / relevantStudents.length) * 100) 
            : 0;
        
        return {
            ...material,
            totalStudents: relevantStudents.length,
            completedStudents: completed,
            completionRate: completionRate
        };
    });
    
    // Sort by completion rate (lowest first to see what needs attention)
    materialStats.sort((a, b) => a.completionRate - b.completionRate);
    
    let html = '<div class="material-stats-list" style="width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box;">';
    materialStats.forEach(stat => {
        html += `
            <div class="material-stat-item" style="width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; word-wrap: break-word;">
                <div class="material-stat-header" style="width: 100%; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <strong style="display: block; word-wrap: break-word; overflow-wrap: break-word;">${stat.sequence ? `Module ${stat.sequence}: ` : ''}${stat.title}</strong>
                        <div class="material-stat-meta" style="flex-wrap: wrap;">
                            <span>${stat.class}</span>
                            ${stat.category ? `<span>📁 ${stat.category}</span>` : ''}
                        </div>
                    </div>
                    <div class="material-stat-rate" style="flex-shrink: 0; white-space: nowrap;">${stat.completionRate}%</div>
                </div>
                <div class="progress-bar-container" style="margin-top: 10px; width: 100%;">
                    <div class="progress-bar" style="width: ${stat.completionRate}%"></div>
                </div>
                <div class="material-stat-footer" style="width: 100%;">
                    <span>${stat.completedStudents}/${stat.totalStudents} students completed</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    materialStatsContent.innerHTML = html;
}

function showAnalytics(tab) {
    // Hide all tabs
    document.querySelectorAll('.analytics-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    if (tab === 'overview') {
        document.getElementById('overviewTab').style.display = 'block';
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tab === 'class-progress') {
        document.getElementById('classProgressTab').style.display = 'block';
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    } else if (tab === 'material-stats') {
        document.getElementById('materialStatsTab').style.display = 'block';
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
    }
    
    // Reload analytics data
    loadAnalytics();
}

async function loadMaterials() {
    const materialsList = document.getElementById('materialsList');
    const filterClass = document.getElementById('filterClass')?.value || 'all';
    const filterCategory = document.getElementById('filterCategory')?.value || 'all';
    
    // Get current lecturer's registered subjects
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        console.error('Unauthorized access attempt to load materials');
        if (materialsList) {
            materialsList.innerHTML = '<p class="empty-state">You must be logged in as a lecturer to view materials.</p>';
        }
        return;
    }
    
    const registeredSubjects = currentUser.courses || [];
    
    // Try Supabase first, fallback to localStorage
    let materials = [];
    
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            const filters = {};
            if (filterClass !== 'all') filters.class = filterClass;
            if (filterCategory !== 'all') filters.category = filterCategory;
            materials = await getMaterialsFromSupabase(filters);
        } catch (err) {
            console.error('Supabase load error:', err);
        }
    }
    
    // Fallback to localStorage
    if (materials.length === 0) {
        materials = JSON.parse(localStorage.getItem('materials') || '[]');
        // Apply filters for localStorage
        if (filterClass !== 'all') {
            materials = materials.filter(m => m.class === filterClass);
        }
        if (filterCategory !== 'all') {
            materials = materials.filter(m => m.category === filterCategory);
        }
    }
    
    // Authorization filter: Only show materials uploaded by current lecturer
    // AND only for subjects the lecturer is registered for
    materials = materials.filter(m => {
        // Check if material belongs to lecturer (by uploaded_by field)
        const belongsToLecturer = m.uploadedBy === currentUser.id || m.uploadedBy === currentUser.name;
        // Check if lecturer is registered for this subject
        const isRegistered = registeredSubjects.length === 0 || registeredSubjects.includes(m.course);
        return belongsToLecturer && isRegistered;
    });
    
    // Update category filter options (get all materials for filter - but only for registered subjects)
    let allMaterials = [];
    if (typeof getMaterialsFromSupabase === 'function') {
        try {
            allMaterials = await getMaterialsFromSupabase({});
        } catch (err) {
            allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
        }
    } else {
        allMaterials = JSON.parse(localStorage.getItem('materials') || '[]');
    }
    
    // Filter allMaterials for category filter too
    if (registeredSubjects.length > 0) {
        allMaterials = allMaterials.filter(m => registeredSubjects.includes(m.course));
    }
    updateCategoryFilter(allMaterials);
    
    if (materials.length === 0) {
        if (registeredSubjects.length === 0) {
            materialsList.innerHTML = '<p class="empty-state">No subjects registered. Please register for subjects above to view materials.</p>';
        } else {
            materialsList.innerHTML = '<p class="empty-state">No materials found for your registered subjects</p>';
        }
        return;
    }
    
    // Sort by sequence number, then by upload date
    materials.sort((a, b) => {
        const seqA = a.sequence || 999;
        const seqB = b.sequence || 999;
        if (seqA !== seqB) return seqA - seqB;
        return new Date(a.uploadedAt || a.uploaded_at) - new Date(b.uploadedAt || b.uploaded_at);
    });
    
    materialsList.innerHTML = materials.map(material => `
        <div class="material-item">
            <div class="material-header">
                <div>
                    <div class="material-title">
                        ${material.sequence ? `<span style="color: #666; font-weight: normal;">Module ${material.sequence}: </span>` : ''}
                        ${material.title}
                    </div>
                    <div class="material-meta">
                        <span>📚 ${material.course}</span>
                        <span>👥 ${material.class}</span>
                        ${material.category ? `<span>📁 ${material.category}</span>` : ''}
                        ${material.isFile ? `<span>📎 ${material.fileName || 'File'}</span>` : ''}
                        <span>📅 ${formatDate(material.uploadedAt)}</span>
                        <span class="badge badge-${material.type}">${material.isFile ? 'FILE' : material.type.toUpperCase()}</span>
                    </div>
                </div>
            </div>
            ${material.description ? `<div class="material-description">${material.description}</div>` : ''}
            <div class="material-description">
                <strong>Uploaded by:</strong> ${material.uploadedBy}
            </div>
            <div class="material-actions">
                <button onclick="window.editMaterial('${material.id}')" class="btn btn-secondary">Edit</button>
                <button onclick="window.deleteMaterial('${material.id}')" class="btn btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateCategoryFilter(materials) {
    const categoryFilter = document.getElementById('filterCategory');
    if (!categoryFilter) return;
    
    const categories = [...new Set(materials.map(m => m.category).filter(c => c))];
    const currentValue = categoryFilter.value;
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    if (currentValue && categories.includes(currentValue)) {
        categoryFilter.value = currentValue;
    }
}

// Make functions globally accessible
window.editMaterial = async function(materialId) {
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
    
    // Populate form with material data
    document.getElementById('courseSelect').value = material.course;
    document.getElementById('classSelect').value = material.class;
    document.getElementById('materialTitle').value = material.title;
    document.getElementById('materialType').value = material.type;
    
    // Handle file vs content
    if (material.isFile) {
        handleMaterialTypeChange();
        // Note: File editing not fully supported - would need to re-upload
        document.getElementById('materialContent').value = '';
        alert('Note: File materials cannot be edited. Please delete and re-upload if changes are needed.');
    } else {
        document.getElementById('materialContent').value = material.content;
    }
    
    document.getElementById('materialDescription').value = material.description || '';
    document.getElementById('materialCategory').value = material.category || '';
    document.getElementById('materialSequence').value = material.sequence || '';
    
    // Store editing material ID
    document.getElementById('uploadForm').dataset.editingId = materialId;
    
    // Change button text and show cancel button
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    submitBtn.textContent = 'Update Material';
    cancelBtn.style.display = 'block';
    
    // Scroll to form
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEdit = function() {

    // Reset form
    document.getElementById('uploadForm').reset();
    
    // Clear editing state
    delete document.getElementById('uploadForm').dataset.editingId;
    
    // Reset button text and hide cancel button
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    submitBtn.textContent = 'Upload Material';
    cancelBtn.style.display = 'none';
};

window.deleteMaterial = async function(materialId) {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
        return;
    }
    
    // Get current user for authorization check
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        if (typeof showError === 'function') {
            showError('You must be logged in as a lecturer to delete materials.', 'Authorization Required');
        } else {
            alert('You must be logged in as a lecturer to delete materials.');
        }
        return;
    }
    
    // Show loading state
    const deleteBtn = event.target;
    const originalText = deleteBtn.textContent;
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    let success = false;
    let errorMessage = '';
    
    // Try Supabase first
    if (typeof deleteMaterialFromSupabase === 'function' && typeof deleteProgressForMaterial === 'function') {
        try {
            // Get material first to verify ownership
            const client = getSupabaseClient();
            if (client) {
                const { data: material, error: materialError } = await client
                    .from('materials')
                    .select('uploaded_by')
                    .eq('id', materialId)
                    .single();
                
                if (materialError) throw materialError;
                
                // Authorization check: Verify material belongs to current lecturer
                if (!material || material.uploaded_by !== currentUser.id) {
                    if (typeof showError === 'function') {
                        showError('You do not have permission to delete this material.', 'Access Denied');
                    } else {
                        alert('You do not have permission to delete this material.');
                    }
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = originalText;
                    return;
                }
            }
            
            // Delete progress tracking first (foreign key constraint)
            await deleteProgressForMaterial(materialId);
            // Delete material (this will also delete file from storage if it exists)
            success = await deleteMaterialFromSupabase(materialId);
            
            if (success) {
                if (typeof showSuccess === 'function') {
                    showSuccess('Material deleted successfully!', 'Delete Successful');
                } else {
                    alert('✅ Material deleted successfully!');
                }
            } else {
                errorMessage = 'Failed to delete material from database';
            }
        } catch (err) {
            console.error('Supabase delete error:', err);
            errorMessage = err.message || 'Database error occurred';
        }
    }
    
    // Fallback to localStorage
    if (!success) {
        console.warn('Falling back to localStorage delete');
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        const filteredMaterials = materials.filter(m => m.id !== materialId);
        localStorage.setItem('materials', JSON.stringify(filteredMaterials));
        
        // Also remove from progress tracking
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        Object.keys(progress).forEach(studentId => {
            if (progress[studentId][materialId]) {
                delete progress[studentId][materialId];
            }
        });
        localStorage.setItem('progress', JSON.stringify(progress));
        success = true;
        if (typeof showInfo === 'function') {
            showInfo('Material deleted (from local storage - Supabase unavailable)', 'Local Storage');
        } else {
            if (typeof showInfo === 'function') {
                showInfo('Material deleted (from local storage - Supabase unavailable)', 'Local Storage');
            } else {
                alert('⚠️ Material deleted (from local storage - Supabase unavailable)');
            }
        }
    }
    
    // Reset button state
    deleteBtn.disabled = false;
    deleteBtn.textContent = originalText;
    
    if (success) {
        loadMaterials();
        if (document.getElementById('analyticsContent')) {
            loadAnalytics();
        }
    } else {
        alert(`❌ Error: ${errorMessage || 'Failed to delete material. Please try again.'}`);
    }
};

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// NOTE: formatClassName is defined earlier in this file (line ~168)
// This duplicate function has been removed to prevent conflicts
// All class name formatting now uses the main formatClassName function above

