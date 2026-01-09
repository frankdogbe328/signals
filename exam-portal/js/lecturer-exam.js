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
        // Check authentication
        let currentUser = getCurrentUser();
        
        // Debug log
        // Debug logs removed - use browser DevTools if needed
        
        if (!currentUser || currentUser.role !== 'lecturer') {
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
                    currentUser = {
                        id: data.id,
                        username: data.username,
                        password: data.password,
                        role: data.role,
                        name: data.name,
                        class: data.class,
                        courses: data.courses || [],
                        email: data.email || null
                    };
                    // Update sessionStorage with fresh data
                    setCurrentUser(currentUser);
                    // User data refreshed successfully
                }
            }
        } catch (err) {
            // Error refreshing user data - will use sessionStorage data
            if (typeof showError === 'function') {
                showError('Could not refresh user data. Some features may be limited.', 'Data Refresh Error');
            }
        }
    }
    
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
        if (typeof showError === 'function') {
            showError('Subject dropdown not found. Please refresh the page.', 'Page Error');
        }
        return;
    }
    
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    if (!currentUser) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No user data - please log in again';
        subjectSelect.appendChild(option);
        if (typeof showError === 'function') {
            showError('User session expired. Please log in again.', 'Session Expired');
        }
        return;
    }
    
    const registeredSubjects = currentUser.courses || [];
    
    if (registeredSubjects.length === 0) {
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
            allSubjects.add(subject);
        }
    });
    
    if (allSubjects.size === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No valid subjects found';
        subjectSelect.appendChild(option);
        return;
    }
    
    // Sort and add subjects to dropdown
    Array.from(allSubjects).sort().forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
    
    // Subjects populated successfully
}

// Handle create exam form submission
async function handleCreateExam(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showError('User session expired. Please log in again.', 'Session Expired');
        return;
    }
    
    const examData = {
        lecturer_id: currentUser.id,
        title: document.getElementById('examTitle').value.trim(),
        description: document.getElementById('examDescription').value.trim(),
        subject: document.getElementById('examSubject').value,
        class_id: document.getElementById('examClass').value,
        duration_minutes: parseInt(document.getElementById('examDuration').value),
        total_marks: parseInt(document.getElementById('examTotalMarks').value),
        passing_score: document.getElementById('examPassingScore').value ? parseInt(document.getElementById('examPassingScore').value) : null,
        start_date: document.getElementById('examStartDate').value ? new Date(document.getElementById('examStartDate').value).toISOString() : null,
        end_date: document.getElementById('examEndDate').value ? new Date(document.getElementById('examEndDate').value).toISOString() : null,
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
        showError('Failed to create exam: ' + (error.message || 'Unknown error'), 'Error Creating Exam');
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
        showError('Failed to load exams: ' + (error.message || 'Unknown error'), 'Error Loading Exams');
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
        
        // Get exam details
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        
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
        showError('Failed to load exam details: ' + (error.message || 'Unknown error'), 'Error Loading Exam Details');
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
            <p><strong>Subject:</strong> ${escapeHtml(exam.subject)}</p>
            <p><strong>Class:</strong> ${formatClassName(exam.class_id)}</p>
            <p><strong>Duration:</strong> ${exam.duration_minutes} minutes</p>
            <p><strong>Total Marks:</strong> ${exam.total_marks}</p>
        </div>
        
        <div style="border-top: 2px solid #e0e0e0; padding-top: 20px;">
            <h3>Questions (${questions.length})</h3>
            <button onclick="addQuestion('${exam.id}')" class="btn btn-primary" style="margin-bottom: 15px;">Add Question</button>
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
        }
    } else if (questionType === 'true_false') {
        document.getElementById('trueFalseSection').style.display = 'block';
    } else if (questionType === 'short_answer' || questionType === 'essay') {
        document.getElementById('textAnswerSection').style.display = 'block';
    }
}

// Add option field for multiple choice
let optionCount = 0;
function addOption() {
    const container = document.getElementById('optionsContainer');
    if (!container) {
        console.error('Options container not found');
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
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-row';
    optionDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
    optionDiv.innerHTML = `
        <label style="display: flex; align-items: center; cursor: pointer; margin-right: 10px;">
            <input type="radio" name="correctOption" value="${optionCount}" style="margin-right: 5px; cursor: pointer;" required>
            <span style="font-weight: 500; min-width: 50px;">Correct</span>
        </label>
        <input type="text" class="option-input" placeholder="Enter option ${optionCount} text here..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 14px;" required>
        <button type="button" onclick="removeOption(this)" class="btn btn-danger" style="padding: 8px 12px; white-space: nowrap;">Remove</button>
    `;
    container.appendChild(optionDiv);
    
    // Focus on the new input field for better UX
    const newInput = optionDiv.querySelector('.option-input');
    if (newInput) {
        setTimeout(() => newInput.focus(), 100);
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
    
    // Renumber remaining options
    const options = container.querySelectorAll('.option-row');
    options.forEach((row, index) => {
        const radio = row.querySelector('input[type="radio"]');
        const textInput = row.querySelector('.option-input');
        const labelSpan = row.querySelector('label span');
        if (radio && textInput) {
            radio.value = index + 1;
            textInput.placeholder = `Enter option ${index + 1} text here...`;
        }
    });
    
    // Update optionCount
    optionCount = options.length;
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
    
    const examId = document.getElementById('questionExamId').value;
    const questionType = document.getElementById('questionType').value;
    const questionText = document.getElementById('questionText').value.trim();
    const marks = parseInt(document.getElementById('questionMarks').value);
    const editId = document.getElementById('questionEditId').value;
    
    if (!examId || !questionType || !questionText) {
        showError('Please fill in all required fields', 'Missing Information');
        return;
    }
    
    let correctAnswer = '';
    let options = null;
    
    // Get correct answer based on question type
    if (questionType === 'multiple_choice') {
        const correctRadio = document.querySelector('input[name="correctOption"]:checked');
        if (!correctRadio) {
            showError('Please select the correct option', 'Missing Selection');
            return;
        }
        
        const optionInputs = document.querySelectorAll('.option-input');
        const optionValues = Array.from(optionInputs).map(input => {
            const value = input.value.trim();
            if (!value) {
                showError('All options must be filled', 'Incomplete Options');
                return null;
            }
            return value;
        });
        
        if (optionValues.includes(null)) return;
        
        const correctIndex = parseInt(correctRadio.value) - 1;
        correctAnswer = optionValues[correctIndex];
        options = JSON.stringify(optionValues);
        
    } else if (questionType === 'true_false') {
        const trueFalseRadio = document.querySelector('input[name="trueFalseAnswer"]:checked');
        if (!trueFalseRadio) {
            showError('Please select correct answer (True/False)', 'Missing Selection');
            return;
        }
        correctAnswer = trueFalseRadio.value;
        
    } else if (questionType === 'short_answer' || questionType === 'essay') {
        const textAnswer = document.getElementById('textAnswer').value.trim();
        if (!textAnswer) {
            showError('Please enter the expected answer or key points', 'Missing Answer');
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
        showError('Failed to save question: ' + (error.message || 'Unknown error'), 'Error Saving Question');
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
        showError('Failed to save question: ' + (error.message || 'Unknown error'), 'Error Saving Question');
    }
}

// Toggle exam status (activate/deactivate)
async function toggleExamStatus(examId, currentStatus) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { error } = await client
            .from('exams')
            .update({ is_active: !currentStatus })
            .eq('id', examId);
        
        if (error) throw error;
        
        showSuccess(`Exam ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'Success');
        loadExams();
        
    } catch (error) {
        showError('Failed to update exam status: ' + (error.message || 'Unknown error'), 'Error Updating Status');
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
        
        const { error } = await client
            .from('exams')
            .update({ results_released: true })
            .eq('id', examId);
        
        if (error) throw error;
        
        showSuccess('Results released successfully! Students can now view their scores.', 'Success');
        loadExams();
        
    } catch (error) {
        showError('Failed to release results: ' + (error.message || 'Unknown error'), 'Error Releasing Results');
    }
}

// View exam statistics and student performance
async function viewExamStats(examId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get exam details
        const { data: exam } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
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
        
        // Show detailed statistics modal
        showDetailedExamStats(exam, attempts, {
            totalAttempts,
            avgScore,
            avgPercentage,
            gradeDistribution
        });
        
    } catch (error) {
        showError('Failed to load statistics: ' + (error.message || 'Unknown error'), 'Error Loading Statistics');
    }
}

// Show detailed exam statistics modal
function showDetailedExamStats(exam, attempts, stats) {
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
    
    // Statistics summary
    let html = `
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
        
        <h3 style="margin-bottom: 15px;">Student Performance</h3>
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white;">
                <thead>
                    <tr style="background: var(--primary-color); color: white;">
                        <th style="padding: 12px; text-align: left;">Student Name</th>
                        <th style="padding: 12px; text-align: left;">Username</th>
                        <th style="padding: 12px; text-align: center;">Score</th>
                        <th style="padding: 12px; text-align: center;">Percentage</th>
                        <th style="padding: 12px; text-align: center;">Grade</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: center;">Submitted</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort attempts by score (highest first)
    const sortedAttempts = [...attempts].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    sortedAttempts.forEach((attempt, index) => {
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
        
        html += `
            <tr style="border-bottom: 1px solid #e0e0e0; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                <td style="padding: 12px;">${escapeHtml(student.name || 'Unknown')}</td>
                <td style="padding: 12px;">${escapeHtml(student.username || 'N/A')}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${attempt.score || 0} / ${exam.total_marks}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${percentage.toFixed(1)}%</td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: ${gradeColors[grade]}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${grade}</span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="color: ${attempt.status === 'time_expired' ? '#dc3545' : '#28a745'};">
                        ${attempt.status === 'time_expired' ? '⏱ Time Expired' : attempt.status === 'auto_submitted' ? '🤖 Auto-Submitted' : '✓ Submitted'}
                    </span>
                </td>
                <td style="padding: 12px; text-align: center; font-size: 12px; color: #666;">${submittedDate}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = html;
    document.getElementById('examStatsModal').style.display = 'block';
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
            
            // Add options one by one
            options.forEach((opt, index) => {
                optionCount = index + 1;
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-row';
                optionDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
                optionDiv.innerHTML = `
                    <label style="display: flex; align-items: center; cursor: pointer; margin-right: 10px;">
                        <input type="radio" name="correctOption" value="${optionCount}" style="margin-right: 5px; cursor: pointer;" required>
                        <span style="font-weight: 500; min-width: 50px;">Correct</span>
                    </label>
                    <input type="text" class="option-input" placeholder="Enter option ${optionCount} text here..." value="${escapeHtml(opt)}" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 14px;" required>
                    <button type="button" onclick="removeOption(this)" class="btn btn-danger" style="padding: 8px 12px; white-space: nowrap;">Remove</button>
                `;
                container.appendChild(optionDiv);
                
                // Check if this is the correct answer
                if (opt === question.correct_answer) {
                    const radio = optionDiv.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                    }
                }
            });
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
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase client not available');
    }
    
    const { error } = await client
        .from('questions')
        .update(questionData)
        .eq('id', questionId);
    
    if (error) throw error;
    
    showSuccess('Question updated successfully!', 'Success');
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
        showError('Failed to delete question: ' + (error.message || 'Unknown error'), 'Error Deleting Question');
    }
}

