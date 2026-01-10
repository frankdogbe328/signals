// Lecturer Exam Portal JavaScript

let currentExamId = null;
let currentQuestions = [];

// Prevent any redirects - set flag immediately
if (typeof window !== 'undefined') {
    window.IS_EXAM_PORTAL = true;
    window.EXAM_PORTAL_LOADED = false;
}

document.addEventListener('DOMContentLoaded', function() {
    // Set flag to prevent any redirects
    window.IS_EXAM_PORTAL = true;
    
    // Wait a bit to ensure sessionStorage is ready and prevent conflicts with app.js
    setTimeout(function() {
        // Check authentication - try secure session first, then fallback
        let currentUser = null;
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getSecureSession) {
            const session = SecurityUtils.getSecureSession();
            if (session && session.user) {
                currentUser = session.user;
            }
        }
        // Fallback to legacy getCurrentUser
        if (!currentUser) {
            currentUser = getCurrentUser();
        }
        
        if (!currentUser || currentUser.role !== 'lecturer') {
            // Clear any invalid sessions
            if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
                SecurityUtils.clearSecureSession();
            }
            // Redirect to exam portal login page
            window.location.href = 'login.html';
            return;
        }
        
        // If we get here, user is authenticated - continue loading
        window.EXAM_PORTAL_LOADED = true;
        initializeExamPortal();
    }, 500); // Increased delay to ensure app.js has finished
});

async function initializeExamPortal() {
    
    let currentUser = getCurrentUser();
    
    // Refresh user data from Supabase to get latest courses
    if (currentUser && currentUser.id && typeof getSupabaseClient === 'function') {
        try {
            const client = getSupabaseClient();
            if (client) {
                const { data, error } = await client
                    .from('users')
                    .select('*')
                    .eq('id', currentUser.id)
                    .maybeSingle();
                
                if (!error && data) {
                    // Update current user with latest data from Supabase
                    // Ensure courses is always an array
                    let courses = data.courses || [];
                    if (!Array.isArray(courses)) {
                        // Handle if courses is stored as JSON string
                        try {
                            courses = typeof courses === 'string' ? JSON.parse(courses) : [];
                        } catch (e) {
                            courses = [];
                        }
                    }
                    
                    currentUser = {
                        id: data.id,
                        username: data.username,
                        password: data.password,
                        role: data.role,
                        name: data.name,
                        class: data.class,
                        courses: courses,
                        email: data.email || null
                    };
                    // Update sessionStorage with fresh data
                    setCurrentUser(currentUser);
                    
                    // Debug logging
                    console.log('User data refreshed, courses:', courses);
                } else if (error) {
                    console.error('Error refreshing user data:', error);
                }
            }
        } catch (err) {
            // Error refreshing user data - will use sessionStorage data
            console.error('Error refreshing user data:', err);
            if (typeof showError === 'function') {
                showError('Could not refresh user data. Some features may be limited.', 'Data Refresh Error');
            }
        }
    }
    
    // Refresh currentUser reference after async operations
    currentUser = getCurrentUser();
    
    // Display lecturer name
    const lecturerNameEl = document.getElementById('lecturerName');
    if (lecturerNameEl) {
        lecturerNameEl.textContent = `Welcome, ${currentUser.name}`;
    }
    
    // Populate subject dropdown based on registered subjects
    populateExamSubjectDropdown();
    
    // Load exams
    loadExams();
    
    // Handle exam form submission
    const examForm = document.getElementById('examForm');
    if (examForm) {
        examForm.addEventListener('submit', handleCreateExam);
    }
}

// Populate subject dropdown with lecturer's registered subjects
function populateExamSubjectDropdown() {
    const currentUser = getCurrentUser();
    
    const subjectSelect = document.getElementById('examSubject');
    if (!subjectSelect) {
        console.error('Subject dropdown element not found');
        if (typeof showError === 'function') {
            showError('Subject dropdown not found. Please refresh the page.', 'Page Error');
        }
        return;
    }
    
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    if (!currentUser) {
        console.error('No current user found');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No user data - please log in again';
        subjectSelect.appendChild(option);
        if (typeof showError === 'function') {
            showError('User session expired. Please log in again.', 'Session Expired');
        }
        return;
    }
    
    // Get registered subjects - handle different data formats
    let registeredSubjects = currentUser.courses || [];
    
    // If courses is a string, try to parse it
    if (typeof registeredSubjects === 'string') {
        try {
            registeredSubjects = JSON.parse(registeredSubjects);
        } catch (e) {
            console.error('Error parsing courses string:', e);
            registeredSubjects = [];
        }
    }
    
    // Ensure it's an array
    if (!Array.isArray(registeredSubjects)) {
        console.error('Courses is not an array:', registeredSubjects);
        registeredSubjects = [];
    }
    
    console.log('Registered subjects for dropdown:', registeredSubjects);
    
    if (registeredSubjects.length === 0) {
        console.warn('No subjects registered for lecturer');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No subjects registered - Register in LMS Portal first';
        subjectSelect.appendChild(option);
        
        // Show info message instead of error
        if (typeof showInfo === 'function') {
            showInfo('Please register for subjects in the LMS portal first. Go to LMS Portal → Register Subjects.', 'No Subjects Registered');
        }
        return;
    }
    
    // Get unique subjects from all classes
    const allSubjects = new Set();
    
    registeredSubjects.forEach(subject => {
        if (subject && typeof subject === 'string') {
            allSubjects.add(subject.trim());
        } else if (subject && typeof subject === 'object' && subject.name) {
            // Handle if subject is an object with a name property
            allSubjects.add(subject.name.trim());
        }
    });
    
    if (allSubjects.size === 0) {
        console.error('No valid subjects found after processing');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No valid subjects found';
        subjectSelect.appendChild(option);
        return;
    }
    
    // Sort and add subjects to dropdown
    const sortedSubjects = Array.from(allSubjects).sort();
    console.log('Adding subjects to dropdown:', sortedSubjects);
    
    sortedSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
    
    // Subjects populated successfully
    console.log(`Successfully populated ${sortedSubjects.length} subjects in dropdown`);
}

// Handle create exam form submission
async function handleCreateExam(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Validate CSRF token
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        // Ensure token exists
        if (typeof SecurityUtils.addCSRFTokenToForm === 'function') {
            SecurityUtils.addCSRFTokenToForm(form);
        }
        
        if (!SecurityUtils.validateFormCSRFToken(form)) {
            showError('Security token validation failed. Please refresh the page and try again.', 'Security Error');
            return;
        }
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        showError('You must be logged in as a lecturer to create exams.', 'Authorization Required');
        return;
    }
    
    // Get and sanitize form inputs
    const rawTitle = document.getElementById('examTitle').value;
    const rawDescription = document.getElementById('examDescription').value;
    const examTitle = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawTitle.trim()) : rawTitle.trim();
    const examDescription = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawDescription.trim()) : rawDescription.trim();
    
    // Validate exam title
    if (!examTitle || examTitle.length < 3 || examTitle.length > 200) {
        showError('Exam title must be between 3 and 200 characters.', 'Validation Error');
        return;
    }
    
    // Validate description length (optional field, but if provided, limit length)
    if (examDescription && examDescription.length > 1000) {
        showError('Exam description must not exceed 1000 characters.', 'Validation Error');
        return;
    }
    
    // Validate numeric inputs
    const durationMinutes = parseInt(document.getElementById('examDuration').value);
    const totalMarks = parseInt(document.getElementById('examTotalMarks').value);
    const passingScore = document.getElementById('examPassingScore').value ? 
        parseInt(document.getElementById('examPassingScore').value) : null;
    
    if (!durationMinutes || durationMinutes < 1 || durationMinutes > 600) {
        showError('Duration must be between 1 and 600 minutes.', 'Validation Error');
        return;
    }
    
    if (!totalMarks || totalMarks < 1 || totalMarks > 10000) {
        showError('Total marks must be between 1 and 10,000.', 'Validation Error');
        return;
    }
    
    if (passingScore !== null && (passingScore < 0 || passingScore > totalMarks)) {
        showError('Passing score must be between 0 and total marks.', 'Validation Error');
        return;
    }
    
    // Validate dates if provided
    let startDate = null;
    let endDate = null;
    const startDateInput = document.getElementById('examStartDate').value;
    const endDateInput = document.getElementById('examEndDate').value;
    
    if (startDateInput) {
        startDate = new Date(startDateInput);
        if (isNaN(startDate.getTime())) {
            showError('Invalid start date format.', 'Validation Error');
            return;
        }
        startDate = startDate.toISOString();
    }
    
    if (endDateInput) {
        endDate = new Date(endDateInput);
        if (isNaN(endDate.getTime())) {
            showError('Invalid end date format.', 'Validation Error');
            return;
        }
        endDate = endDate.toISOString();
        
        // Validate that end date is after start date
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            showError('End date must be after start date.', 'Validation Error');
            return;
        }
    }
    
    const examData = {
        lecturer_id: currentUser.id,
        title: examTitle,
        description: examDescription || null,
        subject: document.getElementById('examSubject').value, // Already validated as dropdown selection
        class_id: document.getElementById('examClass').value, // Already validated as dropdown selection
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        passing_score: passingScore,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        results_released: false
    };
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await client
            .from('exams')
            .insert([examData])
            .select()
            .single();
        
        if (error) throw error;
        
        showSuccess('Exam created successfully! Now add questions.', 'Exam Created');
        
        // Reset form
        document.getElementById('examForm').reset();
        
        // Reload exams
        loadExams();
        
        // Open exam details to add questions
        setTimeout(() => {
            viewExamDetails(data.id);
        }, 1000);
        
    } catch (error) {
        console.error('Error creating exam:', error);
        showError('Failed to create exam. Please check your inputs and try again.', 'Error Creating Exam');
    }
}

// Load all exams for current lecturer
async function loadExams() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await client
            .from('exams')
            .select('*')
            .eq('lecturer_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayExams(data || []);
        
    } catch (error) {
        console.error('Error loading exams:', error);
        showError('Failed to load exams. Please refresh the page and try again.', 'Error Loading Exams');
    }
}

// Display exams list
function displayExams(exams) {
    const examsListEl = document.getElementById('examsList');
    if (!examsListEl) return;
    
    if (exams.length === 0) {
        examsListEl.innerHTML = '<p class="empty-state">No exams created yet</p>';
        return;
    }
    
    examsListEl.innerHTML = exams.map(exam => `
        <div class="question-item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 10px;">${escapeHtml(exam.title)}</h4>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Subject:</strong> ${escapeHtml(exam.subject)}</p>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Class:</strong> ${formatClassName(exam.class_id)}</p>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Duration:</strong> ${exam.duration_minutes} minutes</p>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Total Marks:</strong> ${exam.total_marks}</p>
                    <p style="color: #666; margin-bottom: 5px;">
                        <strong>Status:</strong> 
                        <span style="color: ${exam.is_active ? 'green' : 'red'}">${exam.is_active ? 'Active' : 'Inactive'}</span>
                        ${exam.results_released ? ' | <span style="color: blue;">Results Released</span>' : ' | <span style="color: orange;">Results Pending</span>'}
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-left: 15px;">
                    <button onclick="viewExamDetails('${exam.id}')" class="btn btn-primary">Manage</button>
                    <button onclick="toggleExamStatus('${exam.id}', ${exam.is_active})" class="btn btn-secondary">
                        ${exam.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    ${!exam.results_released ? `<button onclick="releaseResults('${exam.id}')" class="btn btn-success">Release Results</button>` : ''}
                    <button onclick="viewExamStats('${exam.id}')" class="btn btn-secondary">View Stats</button>
                    <button onclick="quickExportPDF('${exam.id}', ${JSON.stringify(exam.title)})" class="btn btn-danger" style="font-size: 12px; padding: 6px 12px; min-width: 60px; display: inline-block;" title="Export Results to PDF">📄 PDF</button>
                    <button onclick="quickExportExcel('${exam.id}', ${JSON.stringify(exam.title)})" class="btn btn-success" style="font-size: 12px; padding: 6px 12px; min-width: 60px; display: inline-block;" title="Export Results to Excel">📊 Excel</button>
                </div>
            </div>
        </div>
    `).join('');
}

// View exam details and manage questions
async function viewExamDetails(examId) {
    currentExamId = examId;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('You must be logged in as a lecturer to view exam details.', 'Authorization Required');
            return;
        }
        
        // Get exam details
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        
        // Authorization check: Verify exam belongs to current lecturer
        if (!exam || exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to view this exam.', 'Access Denied');
            return;
        }
        
        // Get questions
        const { data: questions, error: questionsError } = await client
            .from('questions')
            .select('*')
            .eq('exam_id', examId)
            .order('sequence_order', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        currentQuestions = questions || [];
        
        // Show modal with exam details and questions
        showExamDetailsModal(exam, currentQuestions);
        
    } catch (error) {
        console.error('Error loading exam details:', error);
        showError('Failed to load exam details. Please try again.', 'Error Loading Exam Details');
    }
}

// Show exam details modal
function showExamDetailsModal(exam, questions) {
    const modal = document.getElementById('examDetailsModal');
    const modalTitle = document.getElementById('modalExamTitle');
    const modalContent = document.getElementById('examDetailsContent');
    
    if (!modal || !modalTitle || !modalContent) return;
    
    modalTitle.textContent = exam.title;
    
    modalContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
                <div>
                    <p><strong>Subject:</strong> ${escapeHtml(exam.subject)}</p>
                    <p><strong>Class:</strong> ${formatClassName(exam.class_id)}</p>
                    <p><strong>Duration:</strong> ${exam.duration_minutes} minutes</p>
                    <p><strong>Total Marks:</strong> ${exam.total_marks}</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="viewExamStats('${exam.id}')" class="btn btn-secondary" style="padding: 8px 16px;">📊 View Statistics</button>
                    <button onclick="quickExportPDF('${exam.id}', ${JSON.stringify(exam.title)})" class="btn btn-danger" style="padding: 8px 16px; min-width: 140px; display: inline-block;">📄 Export to PDF</button>
                    <button onclick="quickExportExcel('${exam.id}', ${JSON.stringify(exam.title)})" class="btn btn-success" style="padding: 8px 16px; min-width: 140px; display: inline-block;">📊 Export to Excel</button>
                </div>
            </div>
        </div>
        
        <div style="border-top: 2px solid #e0e0e0; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">Questions (${questions.length})</h3>
                <div style="display: flex; gap: 10px;">
                    <button onclick="showWordUploadDialog('${exam.id}')" class="btn btn-secondary" style="display: flex; align-items: center; gap: 5px;">
                        📄 Upload Word Document
                    </button>
                    <button onclick="addQuestion('${exam.id}')" class="btn btn-primary">+ Add Question</button>
                </div>
            </div>
            <div id="questionsList">
                ${questions.length === 0 ? '<p class="empty-state">No questions added yet</p>' : questions.map((q, index) => displayQuestion(q, index + 1)).join('')}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Display a question in the list
function displayQuestion(question, index) {
    const questionTypeLabels = {
        'multiple_choice': 'Multiple Choice',
        'true_false': 'True/False',
        'short_answer': 'Short Answer',
        'essay': 'Essay'
    };
    
    let optionsHtml = '';
    if (question.question_type === 'multiple_choice' && question.options) {
        const options = JSON.parse(question.options);
        optionsHtml = '<ul style="margin-left: 20px;">' + options.map(opt => `<li>${escapeHtml(opt)}</li>`).join('') + '</ul>';
    }
    
    return `
        <div class="question-item" style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between;">
                <div style="flex: 1;">
                    <p><strong>Q${index}:</strong> ${escapeHtml(question.question_text)}</p>
                    <p style="color: #666; font-size: 14px;"><strong>Type:</strong> ${questionTypeLabels[question.question_type]} | <strong>Marks:</strong> ${question.marks}</p>
                    ${optionsHtml}
                    <p style="color: #666; font-size: 14px;"><strong>Correct Answer:</strong> ${escapeHtml(question.correct_answer)}</p>
                </div>
                <div>
                    <button onclick="editQuestion('${question.id}')" class="btn btn-secondary" style="margin-right: 5px;">Edit</button>
                    <button onclick="deleteQuestion('${question.id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    `;
}

// Add question - Opens interactive form
function addQuestion(examId) {
    // Reset form
    document.getElementById('questionForm').reset();
    document.getElementById('questionExamId').value = examId;
    document.getElementById('questionEditId').value = '';
    document.getElementById('questionFormTitle').textContent = 'Add Question';
    
    // Hide all sections initially
    document.getElementById('multipleChoiceSection').style.display = 'none';
    document.getElementById('trueFalseSection').style.display = 'none';
    document.getElementById('textAnswerSection').style.display = 'none';
    document.getElementById('optionsContainer').innerHTML = '';
    optionCount = 0; // Reset option count
    
    // Show modal
    document.getElementById('questionFormModal').style.display = 'block';
}

// Update form fields based on question type selection
function updateQuestionFormFields() {
    const questionType = document.getElementById('questionType').value;
    
    // Hide all sections first
    document.getElementById('multipleChoiceSection').style.display = 'none';
    document.getElementById('trueFalseSection').style.display = 'none';
    document.getElementById('textAnswerSection').style.display = 'none';
    
    // Show relevant section based on type
    if (questionType === 'multiple_choice') {
        document.getElementById('multipleChoiceSection').style.display = 'block';
        // Initialize with 2 options if container is empty
        const container = document.getElementById('optionsContainer');
        if (container && container.children.length === 0) {
            optionCount = 0; // Reset count
            addOption();
            addOption();
        } else {
            // Attach event listeners to existing inputs and update correct answer selector
            attachOptionInputListeners();
            updateCorrectAnswerSelector();
        }
    } else if (questionType === 'true_false') {
        document.getElementById('trueFalseSection').style.display = 'block';
    } else if (questionType === 'short_answer' || questionType === 'essay') {
        document.getElementById('textAnswerSection').style.display = 'block';
    }
}

// Attach input event listeners to all option inputs for real-time updates
function attachOptionInputListeners() {
    const container = document.getElementById('optionsContainer');
    if (!container) return;
    
    const optionInputs = container.querySelectorAll('.option-input');
    optionInputs.forEach(input => {
        // Check if listener already attached using data attribute
        if (!input.hasAttribute('data-listener-attached')) {
            input.setAttribute('data-listener-attached', 'true');
            input.addEventListener('input', function() {
                updateCorrectAnswerSelector();
            });
        }
    });
}

// Add option field for multiple choice
let optionCount = 0;
function addOption() {
    const container = document.getElementById('optionsContainer');
    if (!container) {
        if (typeof showError === 'function') {
            showError('Options container not found', 'DOM Error');
        } else {
            console.error('Options container not found');
        }
        return;
    }
    
    // Count current options
    const currentOptions = container.querySelectorAll('.option-row').length;
    
    if (currentOptions >= 6) {
        if (typeof showInfo === 'function') {
            showInfo('Maximum 6 options allowed', 'Limit Reached');
        } else {
            alert('Maximum 6 options allowed');
        }
        return;
    }
    
    optionCount = currentOptions + 1;
    const optionLetter = String.fromCharCode(64 + optionCount); // A, B, C, D, E, F
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-row';
    optionDiv.setAttribute('data-option-index', optionCount);
    optionDiv.innerHTML = `
        <span class="option-label">${optionLetter}.</span>
        <input type="text" class="option-input" data-option-letter="${optionLetter}" placeholder="Enter option ${optionLetter} text here..." required>
        <button type="button" onclick="removeOption(this)" class="btn btn-danger">Remove</button>
    `;
    container.appendChild(optionDiv);
    
    // Attach event listener to the new input for real-time updates
    const newInput = optionDiv.querySelector('.option-input');
    if (newInput) {
        // Mark that listener is attached and add input event listener to update dropdown as user types
        newInput.setAttribute('data-listener-attached', 'true');
        newInput.addEventListener('input', function() {
            updateCorrectAnswerSelector();
        });
        
        // Focus on the new input field for better UX
        setTimeout(() => newInput.focus(), 100);
    }
    
    // Update the correct answer selector dropdown
    updateCorrectAnswerSelector();
}

// Update the correct answer selector dropdown
function updateCorrectAnswerSelector() {
    const container = document.getElementById('optionsContainer');
    const correctAnswerSelect = document.getElementById('correctAnswerSelect');
    const correctAnswerSelector = document.getElementById('correctAnswerSelector');
    
    if (!container || !correctAnswerSelect || !correctAnswerSelector) return;
    
    const currentOptions = container.querySelectorAll('.option-row');
    const currentSelectedValue = correctAnswerSelect.value;
    
    // Clear existing options except the first placeholder
    correctAnswerSelect.innerHTML = '<option value="">Select correct option (A, B, C, etc.)</option>';
    
    // Add options based on current rows
    currentOptions.forEach((row, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, E, F
        const optionInput = row.querySelector('.option-input');
        const optionText = optionInput ? optionInput.value.trim() : '';
        const displayText = optionText ? `Option ${optionLetter}: ${optionText.substring(0, 30)}${optionText.length > 30 ? '...' : ''}` : `Option ${optionLetter}`;
        
        const option = document.createElement('option');
        option.value = optionLetter;
        option.textContent = displayText;
        correctAnswerSelect.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentSelectedValue) {
        const optionExists = Array.from(correctAnswerSelect.options).some(opt => opt.value === currentSelectedValue);
        if (optionExists) {
            correctAnswerSelect.value = currentSelectedValue;
        }
    }
    
    // Show/hide the selector based on number of options
    if (currentOptions.length >= 2) {
        correctAnswerSelector.style.display = 'block';
        correctAnswerSelect.required = true;
    } else {
        correctAnswerSelector.style.display = 'none';
        correctAnswerSelect.required = false;
    }
}

// Remove option field
function removeOption(button) {
    const container = document.getElementById('optionsContainer');
    if (!container) return;
    
    const currentOptions = container.querySelectorAll('.option-row').length;
    
    if (currentOptions <= 2) {
        if (typeof showError === 'function') {
            showError('Minimum 2 options required', 'Cannot Remove');
        } else {
            alert('Minimum 2 options required');
        }
        return;
    }
    
    button.closest('.option-row').remove();
    
    // Re-label remaining options (A, B, C, D, etc.)
    const options = container.querySelectorAll('.option-row');
    options.forEach((row, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, E, F
        const labelSpan = row.querySelector('.option-label');
        const textInput = row.querySelector('.option-input');
        
        if (labelSpan) {
            labelSpan.textContent = `${optionLetter}.`;
        }
        if (textInput) {
            textInput.setAttribute('data-option-letter', optionLetter);
            textInput.placeholder = `Enter option ${optionLetter} text here...`;
        }
        row.setAttribute('data-option-index', index + 1);
    });
    
    // Update optionCount
    optionCount = options.length;
    
    // Re-attach event listeners to remaining inputs and update the correct answer selector
    attachOptionInputListeners();
    updateCorrectAnswerSelector();
}

// Close question form modal
function closeQuestionFormModal() {
    document.getElementById('questionFormModal').style.display = 'none';
    document.getElementById('questionForm').reset();
    optionCount = 0;
}

// Handle question form submission
document.addEventListener('DOMContentLoaded', function() {
    const questionForm = document.getElementById('questionForm');
    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionFormSubmit);
    }
});

async function handleQuestionFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Validate CSRF token
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateFormCSRFToken) {
        // Ensure token exists
        if (typeof SecurityUtils.addCSRFTokenToForm === 'function') {
            SecurityUtils.addCSRFTokenToForm(form);
        }
        
        if (!SecurityUtils.validateFormCSRFToken(form)) {
            showError('Security token validation failed. Please refresh the page and try again.', 'Security Error');
            return;
        }
    }
    
    // Authorization check
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        showError('You must be logged in as a lecturer to create questions.', 'Authorization Required');
        return;
    }
    
    // Verify exam belongs to lecturer
    const examId = document.getElementById('questionExamId').value;
    if (examId && currentExamId) {
        try {
            const client = getSupabaseClient();
            if (client) {
                const { data: exam } = await client
                    .from('exams')
                    .select('lecturer_id')
                    .eq('id', examId)
                    .single();
                
                if (exam && exam.lecturer_id !== currentUser.id) {
                    showError('You do not have permission to add questions to this exam.', 'Access Denied');
                    return;
                }
            }
        } catch (err) {
            console.error('Error verifying exam ownership:', err);
        }
    }
    
    const questionType = document.getElementById('questionType').value;
    const rawQuestionText = document.getElementById('questionText').value;
    const questionText = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
        SecurityUtils.sanitizeInput(rawQuestionText.trim()) : rawQuestionText.trim();
    const marksInput = document.getElementById('questionMarks').value;
    const marks = marksInput ? parseInt(marksInput) : 0;
    const editId = document.getElementById('questionEditId').value;
    
    // Validate required fields
    if (!examId || !questionType || !questionText) {
        showError('Please fill in all required fields', 'Missing Information');
        return;
    }
    
    // Validate question text length
    if (questionText.length < 5 || questionText.length > 2000) {
        showError('Question text must be between 5 and 2000 characters.', 'Validation Error');
        return;
    }
    
    // Validate marks
    if (!marks || marks < 1 || marks > 1000) {
        showError('Marks must be between 1 and 1000.', 'Validation Error');
        return;
    }
    
    let correctAnswer = '';
    let options = null;
    
    // Get correct answer based on question type
    if (questionType === 'multiple_choice') {
        const correctAnswerSelect = document.getElementById('correctAnswerSelect');
        if (!correctAnswerSelect || !correctAnswerSelect.value) {
            showError('Please select the correct answer (A, B, C, etc.)', 'Missing Selection');
            return;
        }
        
        const selectedLetter = correctAnswerSelect.value; // A, B, C, D, etc.
        const selectedIndex = selectedLetter.charCodeAt(0) - 65; // Convert to 0-based index
        
        const optionInputs = document.querySelectorAll('.option-input');
        if (optionInputs.length < 2) {
            showError('Minimum 2 options required', 'Incomplete Options');
            return;
        }
        
        const optionValues = Array.from(optionInputs).map(input => {
            const rawValue = input.value;
            const value = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
                SecurityUtils.sanitizeInput(rawValue.trim()) : rawValue.trim();
            
            if (!value) {
                showError('All options must be filled', 'Incomplete Options');
                return null;
            }
            
            // Validate option length
            if (value.length > 500) {
                showError('Each option must not exceed 500 characters.', 'Validation Error');
                return null;
            }
            
            return value;
            
            if (!value) {
                showError('All options must be filled', 'Incomplete Options');
                return null;
            }
            
            // Validate option length
            if (value.length > 500) {
                showError('Each option must not exceed 500 characters.', 'Validation Error');
                return null;
            }
            
            return value;
        });
        
        if (optionValues.includes(null)) return;
        
        if (selectedIndex < 0 || selectedIndex >= optionValues.length) {
            showError('Invalid correct answer selection', 'Selection Error');
            return;
        }
        
        correctAnswer = optionValues[selectedIndex];
        options = JSON.stringify(optionValues);
        
    } else if (questionType === 'true_false') {
        const trueFalseRadio = document.querySelector('input[name="trueFalseAnswer"]:checked');
        if (!trueFalseRadio) {
            showError('Please select correct answer (True/False)', 'Missing Selection');
            return;
        }
        correctAnswer = trueFalseRadio.value;
        
    } else if (questionType === 'short_answer' || questionType === 'essay') {
        const rawTextAnswer = document.getElementById('textAnswer').value;
        const textAnswer = typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeInput ? 
            SecurityUtils.sanitizeInput(rawTextAnswer.trim()) : rawTextAnswer.trim();
        
        if (!textAnswer) {
            showError('Please enter the expected answer or key points', 'Missing Answer');
            return;
        }
        
        // Validate answer length based on question type
        if (questionType === 'short_answer' && textAnswer.length > 500) {
            showError('Short answer must not exceed 500 characters.', 'Validation Error');
            return;
        } else if (questionType === 'essay' && textAnswer.length > 5000) {
            showError('Essay answer key points must not exceed 5000 characters.', 'Validation Error');
            return;
        }
        
        correctAnswer = textAnswer;
    }
    
    if (!correctAnswer) {
        showError('Please provide a correct answer', 'Missing Answer');
        return;
    }
    
    const questionData = {
        question_text: questionText,
        question_type: questionType,
        options: options,
        correct_answer: correctAnswer,
        marks: marks,
        sequence_order: editId ? currentQuestions.findIndex(q => q.id === editId) + 1 : currentQuestions.length + 1
    };
    
    try {
        if (editId) {
            // Update existing question
            await updateQuestion(editId, questionData);
        } else {
            // Save new question
            await saveQuestion(examId, questionData);
        }
        
        // Close modal and refresh
        closeQuestionFormModal();
        
        // Reload exam details to show new question
        viewExamDetails(examId);
        
    } catch (error) {
        console.error('Error saving question:', error);
        showError('Failed to save question. Please check all fields and try again.', 'Error Saving Question');
    }
}

// Save question to database
async function saveQuestion(examId, questionData) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await client
            .from('questions')
            .insert([{
                exam_id: examId,
                ...questionData
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        showSuccess('Question added successfully!', 'Success');
        
        // Reload exam details
        viewExamDetails(examId);
        
    } catch (error) {
        console.error('Error saving question:', error);
        showError('Failed to save question. Please check all fields and try again.', 'Error Saving Question');
    }
}

// Toggle exam status (activate/deactivate)
async function toggleExamStatus(examId, currentStatus) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('You must be logged in as a lecturer to change exam status.', 'Authorization Required');
            return;
        }
        
        // Verify exam belongs to current lecturer
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('lecturer_id')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        if (!exam || exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to modify this exam.', 'Access Denied');
            return;
        }
        
        const { error } = await client
            .from('exams')
            .update({ is_active: !currentStatus })
            .eq('id', examId);
        
        if (error) throw error;
        
        showSuccess(`Exam ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'Success');
        loadExams();
        
    } catch (error) {
        console.error('Error updating exam status:', error);
        showError('Failed to update exam status. Please try again.', 'Error Updating Status');
    }
}

// Release exam results
async function releaseResults(examId) {
    if (!confirm('Are you sure you want to release results for this exam? Students will be able to see their scores.')) {
        return;
    }
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('You must be logged in as a lecturer to release results.', 'Authorization Required');
            return;
        }
        
        // Verify exam belongs to current lecturer
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('lecturer_id')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        if (!exam || exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to release results for this exam.', 'Access Denied');
            return;
        }
        
        const { error } = await client
            .from('exams')
            .update({ results_released: true })
            .eq('id', examId);
        
        if (error) throw error;
        
        showSuccess('Results released successfully! Students can now view their scores.', 'Success');
        loadExams();
        
    } catch (error) {
        console.error('Error releasing results:', error);
        showError('Failed to release results. Please try again.', 'Error Releasing Results');
    }
}

// View exam statistics and student performance
async function viewExamStats(examId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('You must be logged in as a lecturer to view exam statistics.', 'Authorization Required');
            return;
        }
        
        // Get exam details and verify ownership
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        if (!exam) {
            showError('Exam not found.', 'Error');
            return;
        }
        
        // Authorization check: Verify exam belongs to current lecturer
        if (exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to view statistics for this exam.', 'Access Denied');
            return;
        }
        
        // Get all attempts (submitted, auto_submitted, time_expired)
        const { data: attempts, error } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('submitted_at', { ascending: false });
        
        // Get user details for each attempt
        if (attempts && attempts.length > 0) {
            const userIds = [...new Set(attempts.map(a => a.student_id))];
            const { data: users } = await client
                .from('users')
                .select('id, name, username, class')
                .in('id', userIds);
            
            // Map users to attempts
            const userMap = {};
            (users || []).forEach(u => {
                userMap[u.id] = u;
            });
            
            attempts.forEach(attempt => {
                attempt.users = userMap[attempt.student_id] || {};
            });
        }
        
        if (error) throw error;
        
        const totalAttempts = attempts.length;
        const avgScore = totalAttempts > 0 ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts : 0;
        const avgPercentage = totalAttempts > 0 ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts : 0;
        
        // Calculate grade distribution
        const gradeDistribution = {
            A: attempts.filter(a => (a.percentage || 0) >= 90).length,
            B: attempts.filter(a => (a.percentage || 0) >= 80 && (a.percentage || 0) < 90).length,
            C: attempts.filter(a => (a.percentage || 0) >= 70 && (a.percentage || 0) < 80).length,
            D: attempts.filter(a => (a.percentage || 0) >= 60 && (a.percentage || 0) < 70).length,
            F: attempts.filter(a => (a.percentage || 0) < 60).length
        };
        
        // Store exam globally for filtering
        window.currentExam = exam;
        
        // Show detailed statistics modal
        showDetailedExamStats(exam, attempts, {
            totalAttempts,
            avgScore,
            avgPercentage,
            gradeDistribution
        }, examId);
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('Failed to load statistics. Please try again later.', 'Error Loading Statistics');
    }
}

// Show detailed exam statistics modal
function showDetailedExamStats(exam, attempts, stats, examId) {
    const modal = document.getElementById('examStatsModal');
    if (!modal) {
        // Create modal if it doesn't exist
        const modalHTML = `
            <div id="examStatsModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                    <span class="close-modal" onclick="closeExamStatsModal()">&times;</span>
                    <h2>Exam Performance: ${escapeHtml(exam.title)}</h2>
                    <div id="examStatsContent"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const content = document.getElementById('examStatsContent');
    if (!content) return;
    
    // Statistics summary with export buttons
    const examTitleEscaped = typeof SecurityUtils !== 'undefined' && SecurityUtils.escapeHtml ? 
        SecurityUtils.escapeHtml(exam.title) : escapeHtml(exam.title);
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
            <h3 style="margin: 0;">Exam Statistics</h3>
            <div style="display: flex; gap: 10px;">
                <button onclick="quickExportPDF('${examId}', '${examTitleEscaped}')" class="btn btn-danger" style="padding: 8px 16px; font-size: 14px; min-width: 140px; display: inline-block;" id="exportPdfBtn">
                    📄 Export to PDF
                </button>
                <button onclick="quickExportExcel('${examId}', '${examTitleEscaped}')" class="btn btn-success" style="padding: 8px 16px; font-size: 14px; min-width: 140px; display: inline-block;" id="exportExcelBtn">
                    📊 Export to Excel
                </button>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
            <div style="background: #e6f2ff; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${stats.totalAttempts}</div>
                <div style="color: #666; font-size: 14px;">Total Submissions</div>
            </div>
            <div style="background: #e6f2ff; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${stats.avgScore.toFixed(1)}</div>
                <div style="color: #666; font-size: 14px;">Average Score</div>
            </div>
            <div style="background: #e6f2ff; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${stats.avgPercentage.toFixed(1)}%</div>
                <div style="color: #666; font-size: 14px;">Average Percentage</div>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-bottom: 15px;">Grade Distribution</h3>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #28a745;">${stats.gradeDistribution.A}</div>
                    <div style="font-size: 12px; color: #666;">A (90-100%)</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #17a2b8;">${stats.gradeDistribution.B}</div>
                    <div style="font-size: 12px; color: #666;">B (80-89%)</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #ffc107;">${stats.gradeDistribution.C}</div>
                    <div style="font-size: 12px; color: #666;">C (70-79%)</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #fd7e14;">${stats.gradeDistribution.D}</div>
                    <div style="font-size: 12px; color: #666;">D (60-69%)</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #dc3545;">${stats.gradeDistribution.F}</div>
                    <div style="font-size: 12px; color: #666;">F (<60%)</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 15px; display: inline-block;">Student Performance</h3>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <input type="text" id="studentSearchInput" placeholder="🔍 Search by name or username..." 
                       style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 4px; font-size: 14px; flex: 1; min-width: 200px;"
                       onkeyup="filterStudentResults()">
                <select id="sortBySelect" onchange="sortStudentResults()" 
                        style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 4px; font-size: 14px;">
                    <option value="score-desc">Sort by: Score (High to Low)</option>
                    <option value="score-asc">Sort by: Score (Low to High)</option>
                    <option value="name-asc">Sort by: Name (A-Z)</option>
                    <option value="name-desc">Sort by: Name (Z-A)</option>
                    <option value="date-desc">Sort by: Date (Newest)</option>
                    <option value="date-asc">Sort by: Date (Oldest)</option>
                </select>
                <select id="gradeFilterSelect" onchange="filterStudentResults()" 
                        style="padding: 8px 12px; border: 2px solid #ddd; border-radius: 4px; font-size: 14px;">
                    <option value="all">All Grades</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                    <option value="F">Grade F</option>
                </select>
            </div>
            <div id="studentResultsCount" style="margin-top: 10px; color: #666; font-size: 14px;"></div>
        </div>
        
        <div style="overflow-x: auto;">
            <table id="studentResultsTable" style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: var(--primary-color); color: white;">
                        <th style="padding: 12px; text-align: left;">Student Name</th>
                        <th style="padding: 12px; text-align: left;">Username</th>
                        <th style="padding: 12px; text-align: left;">Class</th>
                        <th style="padding: 12px; text-align: center;">Score</th>
                        <th style="padding: 12px; text-align: center;">Percentage</th>
                        <th style="padding: 12px; text-align: center;">Grade</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: center;">Submitted</th>
                    </tr>
                </thead>
                <tbody id="studentResultsTableBody">
    `;
    
    // Store attempts globally for filtering/sorting
    window.currentExamAttempts = attempts;
    
    // Sort attempts by score (highest first) - default
    const sortedAttempts = [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Render table rows
    renderStudentResultsTable(sortedAttempts, exam);
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = html;
    updateStudentResultsCount(sortedAttempts.length, attempts.length);
    document.getElementById('examStatsModal').style.display = 'block';
}

// Render student results table rows
function renderStudentResultsTable(attempts, exam) {
    const tbody = document.getElementById('studentResultsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = attempts.map((attempt, index) => {
        const student = attempt.users || {};
        const percentage = attempt.percentage || 0;
        const grade = calculateGrade(percentage);
        const gradeColors = {
            A: '#28a745',
            B: '#17a2b8',
            C: '#ffc107',
            D: '#fd7e14',
            F: '#dc3545'
        };
        const submittedDate = attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A';
        
        return `
            <tr style="border-bottom: 1px solid #e0e0e0; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                <td style="padding: 12px;">${escapeHtml(student.name || 'Unknown')}</td>
                <td style="padding: 12px;">${escapeHtml(student.username || 'N/A')}</td>
                <td style="padding: 12px;">${escapeHtml(student.class || 'N/A')}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${attempt.score || 0} / ${exam.total_marks}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${percentage.toFixed(1)}%</td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: ${gradeColors[grade]}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${grade}</span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="color: ${attempt.status === 'time_expired' ? '#dc3545' : '#28a745';}">
                        ${attempt.status === 'time_expired' ? '⏱ Time Expired' : attempt.status === 'auto_submitted' ? '🤖 Auto-Submitted' : '✓ Submitted'}
                    </span>
                </td>
                <td style="padding: 12px; text-align: center; font-size: 12px; color: #666;">${submittedDate}</td>
            </tr>
        `;
    }).join('');
}

// Filter student results by search query and grade
function filterStudentResults() {
    if (!window.currentExamAttempts) return;
    
    const searchQuery = document.getElementById('studentSearchInput')?.value.toLowerCase().trim() || '';
    const gradeFilter = document.getElementById('gradeFilterSelect')?.value || 'all';
    const exam = window.currentExam || {};
    
    let filtered = window.currentExamAttempts.filter(attempt => {
        const student = attempt.users || {};
        const studentName = (student.name || '').toLowerCase();
        const username = (student.username || '').toLowerCase();
        
        // Search filter
        const matchesSearch = !searchQuery || 
            studentName.includes(searchQuery) || 
            username.includes(searchQuery);
        
        // Grade filter
        const percentage = attempt.percentage || 0;
        const grade = calculateGrade(percentage);
        const matchesGrade = gradeFilter === 'all' || grade === gradeFilter;
        
        return matchesSearch && matchesGrade;
    });
    
    // Apply current sort
    sortStudentResults(filtered);
}

// Sort student results
function sortStudentResults(preFiltered = null) {
    if (!window.currentExamAttempts) return;
    
    const sortBy = document.getElementById('sortBySelect')?.value || 'score-desc';
    let sorted = preFiltered ? [...preFiltered] : [...window.currentExamAttempts];
    
    switch (sortBy) {
        case 'score-desc':
            sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
            break;
        case 'score-asc':
            sorted.sort((a, b) => (a.score || 0) - (b.score || 0));
            break;
        case 'name-asc':
            sorted.sort((a, b) => {
                const nameA = (a.users?.name || '').toLowerCase();
                const nameB = (b.users?.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'name-desc':
            sorted.sort((a, b) => {
                const nameA = (a.users?.name || '').toLowerCase();
                const nameB = (b.users?.name || '').toLowerCase();
                return nameB.localeCompare(nameA);
            });
            break;
        case 'date-desc':
            sorted.sort((a, b) => {
                const dateA = a.submitted_at ? new Date(a.submitted_at) : new Date(0);
                const dateB = b.submitted_at ? new Date(b.submitted_at) : new Date(0);
                return dateB - dateA;
            });
            break;
        case 'date-asc':
            sorted.sort((a, b) => {
                const dateA = a.submitted_at ? new Date(a.submitted_at) : new Date(0);
                const dateB = b.submitted_at ? new Date(b.submitted_at) : new Date(0);
                return dateA - dateB;
            });
            break;
    }
    
    renderStudentResultsTable(sorted, window.currentExam || {});
    updateStudentResultsCount(sorted.length, window.currentExamAttempts.length);
}

// Update results count display
function updateStudentResultsCount(shown, total) {
    const countEl = document.getElementById('studentResultsCount');
    if (countEl) {
        if (shown === total) {
            countEl.textContent = `Showing ${total} student${total !== 1 ? 's' : ''}`;
        } else {
            countEl.textContent = `Showing ${shown} of ${total} student${total !== 1 ? 's' : ''}`;
        }
    }
}

// Calculate grade from percentage
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

// Close exam stats modal
function closeExamStatsModal() {
    const modal = document.getElementById('examStatsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close exam modal
function closeExamModal() {
    const modal = document.getElementById('examDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentExamId = null;
    currentQuestions = [];
}

// Quick export wrapper functions (check if export functions are loaded)
function quickExportPDF(examId, examTitle) {
    if (typeof exportResultsToPDF === 'undefined') {
        showError('Export functionality is still loading. Please wait a moment and try again, or check the browser console for errors.', 'Export Not Available');
        console.error('exportResultsToPDF function not found. Make sure export-results.js is loaded.');
        return;
    }
    exportResultsToPDF(examId, examTitle);
}

function quickExportExcel(examId, examTitle) {
    if (typeof exportResultsToExcel === 'undefined') {
        showError('Export functionality is still loading. Please wait a moment and try again, or check the browser console for errors.', 'Export Not Available');
        console.error('exportResultsToExcel function not found. Make sure export-results.js is loaded.');
        return;
    }
    exportResultsToExcel(examId, examTitle);
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatClassName(classId) {
    const classNames = {
        'signals-basic': 'SIGNALS BASIC',
        'signals-b-iii-b-ii': 'SIGNALS B III – B II',
        'signals-b-ii-b-i': 'SIGNALS B II – B I',
        'superintendent': 'SUPERINTENDENT',
        'pre-qualifying': 'PRE-QUALIFYING',
        'regimental-basic': 'REGIMENTAL BASIC',
        'regimental-b-iii-b-ii': 'REGIMENTAL B III – B II',
        'regimental-b-ii-b-i': 'REGIMENTAL B II – B I',
        'rso-rsi': 'RSO / RSI',
        'electronic-warfare-course': 'ELECTRONIC WARFARE COURSE',
        'tactical-drone-course': 'TACTICAL DRONE COURSE'
    };
    return classNames[classId] || classId;
}

// Edit question - Opens form with existing question data
function editQuestion(questionId) {
    const question = currentQuestions.find(q => q.id === questionId);
    if (!question) {
        showError('Question not found', 'Error');
        return;
    }
    
    // Populate form with question data
    document.getElementById('questionExamId').value = question.exam_id || currentExamId;
    document.getElementById('questionEditId').value = questionId;
    document.getElementById('questionFormTitle').textContent = 'Edit Question';
    document.getElementById('questionType').value = question.question_type;
    document.getElementById('questionText').value = question.question_text;
    document.getElementById('questionMarks').value = question.marks || 1;
    
    // Update form fields based on type
    updateQuestionFormFields();
    
    // Populate fields based on type
    if (question.question_type === 'multiple_choice' && question.options) {
        const options = JSON.parse(question.options);
        const container = document.getElementById('optionsContainer');
        if (container) {
            container.innerHTML = '';
            optionCount = 0;
            
            let correctAnswerLetter = null;
            
            // Add options one by one with A, B, C, D labels
            options.forEach((opt, index) => {
                optionCount = index + 1;
                const optionLetter = String.fromCharCode(64 + optionCount); // A, B, C, D, E, F
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-row';
                optionDiv.setAttribute('data-option-index', optionCount);
                optionDiv.innerHTML = `
                    <span class="option-label">${optionLetter}.</span>
                    <input type="text" class="option-input" data-option-letter="${optionLetter}" placeholder="Enter option ${optionLetter} text here..." value="${escapeHtml(opt)}" required>
                    <button type="button" onclick="removeOption(this)" class="btn btn-danger">Remove</button>
                `;
                container.appendChild(optionDiv);
                
                // Attach input event listener to this input for real-time updates
                const inputElement = optionDiv.querySelector('.option-input');
                if (inputElement) {
                    inputElement.setAttribute('data-listener-attached', 'true');
                    inputElement.addEventListener('input', function() {
                        updateCorrectAnswerSelector();
                    });
                }
                
                // Check if this is the correct answer
                if (opt === question.correct_answer) {
                    correctAnswerLetter = optionLetter;
                }
            });
            
            // Update the correct answer selector dropdown and set the selected value
            // Use a small delay to ensure DOM is ready
            setTimeout(() => {
                updateCorrectAnswerSelector();
                if (correctAnswerLetter) {
                    const correctAnswerSelect = document.getElementById('correctAnswerSelect');
                    if (correctAnswerSelect) {
                        // Set the correct answer after selector is populated
                        setTimeout(() => {
                            correctAnswerSelect.value = correctAnswerLetter;
                        }, 10);
                    }
                }
            }, 10);
        }
    } else if (question.question_type === 'true_false') {
        const radios = document.querySelectorAll('input[name="trueFalseAnswer"]');
        if (question.correct_answer === 'True') {
            radios[0].checked = true;
        } else {
            radios[1].checked = true;
        }
    } else if (question.question_type === 'short_answer' || question.question_type === 'essay') {
        document.getElementById('textAnswer').value = question.correct_answer || '';
    }
    
    // Show modal
    document.getElementById('questionFormModal').style.display = 'block';
}

// Update question in database
async function updateQuestion(questionId, questionData) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('You must be logged in as a lecturer to update questions.', 'Authorization Required');
            return;
        }
        
        // Get the question first to verify ownership
        const { data: question, error: questionError } = await client
            .from('questions')
            .select('exam_id, exams!inner(lecturer_id)')
            .eq('id', questionId)
            .single();
        
        if (questionError) throw questionError;
        if (!question) {
            showError('Question not found.', 'Error');
            return;
        }
        
        // Authorization check: Verify question belongs to lecturer's exam
        const examLecturerId = question.exams?.lecturer_id || question.exam_id;
        // If we got the lecturer_id from join, use it; otherwise check via exam
        if (question.exams && question.exams.lecturer_id !== currentUser.id) {
            showError('You do not have permission to update this question.', 'Access Denied');
            return;
        }
        
        // If we don't have lecturer_id from join, verify via exam
        if (!question.exams) {
            const { data: exam, error: examError } = await client
                .from('exams')
                .select('lecturer_id')
                .eq('id', question.exam_id)
                .single();
            
            if (examError || !exam || exam.lecturer_id !== currentUser.id) {
                showError('You do not have permission to update this question.', 'Access Denied');
                return;
            }
        }
        
        // Update the question
        const { error } = await client
            .from('questions')
            .update(questionData)
            .eq('id', questionId);
        
        if (error) throw error;
        
        showSuccess('Question updated successfully!', 'Success');
    } catch (error) {
        console.error('Error updating question:', error);
        showError('Failed to update question. Please try again.', 'Error Updating Question');
        throw error;
    }
}

// Delete question
async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
        return;
    }
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('You must be logged in as a lecturer to delete questions.', 'Authorization Required');
            return;
        }
        
        // Get the question first to verify ownership
        const { data: question, error: questionError } = await client
            .from('questions')
            .select('exam_id')
            .eq('id', questionId)
            .single();
        
        if (questionError) throw questionError;
        if (!question) {
            showError('Question not found.', 'Error');
            return;
        }
        
        // Verify question belongs to lecturer's exam
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('lecturer_id')
            .eq('id', question.exam_id)
            .single();
        
        if (examError) throw examError;
        if (!exam || exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to delete this question.', 'Access Denied');
            return;
        }
        
        // Delete the question
        const { error } = await client
            .from('questions')
            .delete()
            .eq('id', questionId);
        
        if (error) throw error;
        
        showSuccess('Question deleted successfully!', 'Success');
        
        // Reload exam details
        if (currentExamId) {
            viewExamDetails(currentExamId);
        }
        
    } catch (error) {
        console.error('Error deleting question:', error);
        showError('Failed to delete question. Please try again.', 'Error Deleting Question');
    }
}

// Show Word document upload dialog
function showWordUploadDialog(examId) {
    const modal = document.getElementById('wordUploadModal');
    const fileInput = document.getElementById('wordFileInput');
    const progressDiv = document.getElementById('wordUploadProgress');
    const statusDiv = document.getElementById('wordUploadStatus');
    const progressBar = document.getElementById('wordUploadProgressBar');
    
    if (!modal) {
        showError('Upload modal not found. Please refresh the page.', 'Error');
        return;
    }
    
    // Store exam ID for processing
    modal.setAttribute('data-exam-id', examId);
    
    // Reset form
    if (fileInput) fileInput.value = '';
    if (progressDiv) progressDiv.style.display = 'none';
    if (statusDiv) statusDiv.textContent = 'Processing...';
    if (progressBar) progressBar.style.width = '0%';
    
    modal.style.display = 'block';
}

// Close Word upload modal
function closeWordUploadModal() {
    const modal = document.getElementById('wordUploadModal');
    if (modal) {
        modal.style.display = 'none';
        const fileInput = document.getElementById('wordFileInput');
        if (fileInput) fileInput.value = '';
    }
}

// Process Word document and extract questions
async function processWordDocument() {
    const fileInput = document.getElementById('wordFileInput');
    const modal = document.getElementById('wordUploadModal');
    const progressDiv = document.getElementById('wordUploadProgress');
    const statusDiv = document.getElementById('wordUploadStatus');
    const progressBar = document.getElementById('wordUploadProgressBar');
    const processBtn = document.getElementById('processWordBtn');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showError('Please select a Word document file first.', 'No File Selected');
        return;
    }
    
    const file = fileInput.files[0];
    const examId = modal ? modal.getAttribute('data-exam-id') : currentExamId;
    
    if (!examId) {
        showError('Exam ID not found. Please try again.', 'Error');
        return;
    }
    
    // Validate file using security utils
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.validateWordDocument) {
        const validation = SecurityUtils.validateWordDocument(file);
        if (!validation.valid) {
            showError(validation.error || 'Invalid file', 'File Validation Error');
            return;
        }
    } else {
        // Fallback validation
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.docx')) {
            showError('Please upload a .docx file only. Older .doc files are not supported. You can save .doc files as .docx in Microsoft Word.', 'Invalid File Type');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showError('File size exceeds 5MB limit.', 'File Too Large');
            return;
        }
    }
    
    // Sanitize filename
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.sanitizeFilename) {
        file.name = SecurityUtils.sanitizeFilename(file.name);
    }
    
    // Check if mammoth is available
    if (typeof mammoth === 'undefined') {
        showError('Word document parser not loaded. Please refresh the page and try again.', 'Library Error');
        return;
    }
    
    // Show progress
    if (progressDiv) progressDiv.style.display = 'block';
    if (statusDiv) statusDiv.textContent = 'Reading document...';
    if (progressBar) progressBar.style.width = '20%';
    if (processBtn) processBtn.disabled = true;
    
    try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        if (statusDiv) statusDiv.textContent = 'Parsing document...';
        if (progressBar) progressBar.style.width = '40%';
        
        // Convert Word document to HTML using mammoth
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const text = result.value;
        const messages = result.messages;
        
        if (messages && messages.length > 0) {
            console.warn('Word parsing warnings:', messages);
        }
        
        if (!text || text.trim().length === 0) {
            throw new Error('Document appears to be empty or could not be read.');
        }
        
        if (statusDiv) statusDiv.textContent = 'Extracting questions...';
        if (progressBar) progressBar.style.width = '60%';
        
        // Parse questions from text (use enhanced parser if available)
        let parsedQuestions = [];
        if (typeof parseQuestionsFromTextEnhanced !== 'undefined') {
            parsedQuestions = parseQuestionsFromTextEnhanced(text);
        } else {
            parsedQuestions = parseQuestionsFromText(text);
        }
        
        if (parsedQuestions.length === 0) {
            throw new Error('No questions found in the document. Please check the format and try again.');
        }
        
        if (statusDiv) statusDiv.textContent = `Found ${parsedQuestions.length} question(s). Saving...`;
        if (progressBar) progressBar.style.width = '80%';
        
        // Save questions to database
        await saveParsedQuestions(examId, parsedQuestions);
        
        if (statusDiv) statusDiv.textContent = `Successfully imported ${parsedQuestions.length} question(s)!`;
        if (progressBar) progressBar.style.width = '100%';
        
        showSuccess(`Successfully imported ${parsedQuestions.length} question(s) from the Word document!`, 'Import Successful');
        
        // Close modal and refresh exam details after a short delay
        setTimeout(() => {
            closeWordUploadModal();
            viewExamDetails(examId);
        }, 1500);
        
    } catch (error) {
        console.error('Error processing Word document:', error);
        showError('Failed to process Word document. Please ensure the file is a valid .docx file and try again.', 'Processing Error');
        if (statusDiv) statusDiv.textContent = 'Error: Failed to process document. Please try again.';
        if (progressBar) progressBar.style.width = '0%';
    } finally {
        if (processBtn) processBtn.disabled = false;
    }
}

// Parse questions from text content
function parseQuestionsFromText(text) {
    const questions = [];
    // Split by lines and clean them up
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion = null;
    let currentOptions = [];
    let currentAnswer = null;
    let questionNumber = 1;
    let isCollectingQuestion = false;
    let isCollectingOptions = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if line is a question number (1., 2., Q1, Question 1, etc.)
        const questionMatch = line.match(/^((?:Question\s*)?\d+|Q\d+)\.?\s*:?\s*(.+)$/i);
        if (questionMatch) {
            // Save previous question if exists
            if (currentQuestion) {
                const questionData = buildQuestionData(currentQuestion, currentOptions, currentAnswer, questionNumber);
                if (questionData) {
                    questions.push(questionData);
                    questionNumber++;
                }
            }
            
            // Start new question
            currentQuestion = questionMatch[2];
            currentOptions = [];
            currentAnswer = null;
            isCollectingQuestion = true;
            isCollectingOptions = false;
            continue;
        }
        
        // Check if line is an option (A., B., C., etc. or a) b) c))
        const optionMatch = line.match(/^([A-F]|[a-f])\)?\.?\s*:?\s*(.+)$/i);
        if (optionMatch && (currentQuestion || isCollectingOptions)) {
            currentOptions.push(optionMatch[2].trim());
            isCollectingOptions = true;
            isCollectingQuestion = false;
            continue;
        }
        
        // Check if line contains answer (Answer:, Correct Answer:, Ans:, etc.)
        const answerMatch = line.match(/^(?:Correct\s+)?Answer:?\s*(.+)$/i);
        if (answerMatch) {
            currentAnswer = answerMatch[1].trim();
            isCollectingQuestion = false;
            isCollectingOptions = false;
            continue;
        }
        
        // If we're collecting a question, append continuation lines
        if (isCollectingQuestion && currentQuestion && !optionMatch && !answerMatch) {
            // Don't append if it looks like it might be the start of options or answer
            if (!line.match(/^([A-F]|Answer|Correct)/i)) {
                currentQuestion += ' ' + line;
            } else {
                isCollectingQuestion = false;
            }
        }
        // If we're collecting options, check if line continues an option (no letter prefix)
        else if (isCollectingOptions && currentOptions.length > 0 && !optionMatch && !answerMatch) {
            // Append to last option if it doesn't look like a new question
            if (!line.match(/^\d+\.|^Q\d+/i)) {
                currentOptions[currentOptions.length - 1] += ' ' + line;
            } else {
                isCollectingOptions = false;
            }
        }
        // If we have a question but no options yet, might be continuation of question text
        else if (currentQuestion && currentOptions.length === 0 && !answerMatch && !optionMatch) {
            if (!line.match(/^\d+\.|^Q\d+|^Answer/i)) {
                currentQuestion += ' ' + line;
            }
        }
    }
    
    // Save last question
    if (currentQuestion) {
        const questionData = buildQuestionData(currentQuestion, currentOptions, currentAnswer, questionNumber);
        if (questionData) {
            questions.push(questionData);
        }
    }
    
    return questions;
}

// Build question data object from parsed components
function buildQuestionData(questionText, options, answer, sequenceOrder) {
    if (!questionText || !answer) {
        return null;
    }
    
    questionText = questionText.trim();
    answer = answer.trim();
    
    // Determine question type based on options and answer
    let questionType = 'short_answer';
    let optionsJson = null;
    let correctAnswer = answer;
    
    // Check for True/False (answer is True or False, and no multiple choice options)
    const answerLower = answer.toLowerCase();
    if ((answerLower === 'true' || answerLower === 'false' || answerLower === 't' || answerLower === 'f') && 
        options.length === 0) {
        questionType = 'true_false';
        if (answerLower === 't' || answerLower === 'true') {
            correctAnswer = 'True';
        } else {
            correctAnswer = 'False';
        }
    }
    // Check for multiple choice (has options A, B, C, etc.)
    else if (options.length >= 2) {
        questionType = 'multiple_choice';
        optionsJson = JSON.stringify(options);
        
        // Find correct answer in options
        // Answer might be a letter (A, B, C) or the actual text
        const answerLetter = answer.toUpperCase().charAt(0);
        const letterIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
        
        if (letterIndex >= 0 && letterIndex < options.length) {
            correctAnswer = options[letterIndex];
        } else {
            // Answer might be the actual option text
            const foundOption = options.find(opt => opt.toLowerCase() === answer.toLowerCase());
            if (foundOption) {
                correctAnswer = foundOption;
            } else {
                // Use first option as fallback (shouldn't happen with good formatting)
                correctAnswer = options[0];
            }
        }
    }
    // Check for essay (long answer)
    else if (answer.length > 100 || questionText.toLowerCase().includes('explain') || 
             questionText.toLowerCase().includes('describe') || questionText.toLowerCase().includes('discuss')) {
        questionType = 'essay';
    }
    
    return {
        question_text: questionText,
        question_type: questionType,
        options: optionsJson,
        correct_answer: correctAnswer,
        marks: 1, // Default marks, can be adjusted later
        sequence_order: sequenceOrder
    };
}

// Save parsed questions to database
async function saveParsedQuestions(examId, questions) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current question count to set sequence order
        const { data: existingQuestions } = await client
            .from('questions')
            .select('id')
            .eq('exam_id', examId);
        
        const startSequence = (existingQuestions?.length || 0) + 1;
        
        // Prepare questions for insertion
        const questionsToInsert = questions.map((q, index) => ({
            exam_id: examId,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            marks: q.marks,
            sequence_order: startSequence + index
        }));
        
        // Insert questions
        const { error } = await client
            .from('questions')
            .insert(questionsToInsert);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error saving questions to database:', error);
        throw new Error('Failed to save questions to database. Please try again.');
    }
}

