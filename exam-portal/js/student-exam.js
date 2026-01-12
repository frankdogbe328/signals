// Student Exam Portal JavaScript

// Helper function to parse options (handles both JSON arrays and comma-separated strings)
function parseQuestionOptions(optionsString) {
    if (!optionsString) return [];
    
    try {
        // Try parsing as JSON first
        const parsed = JSON.parse(optionsString);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        // If it's not an array, treat as single value
        return [parsed];
    } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        if (typeof optionsString === 'string') {
            return optionsString.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
        }
        return [];
    }
}

let currentExam = null;
let currentAttempt = null;
let questions = [];
let randomizedQuestions = [];
let currentQuestionIndex = 0;
let answers = {}; // Store answers: { questionId: answer }
let timerInterval = null;
let timeRemaining = 0;

document.addEventListener('DOMContentLoaded', function() {
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
    
    if (!currentUser || currentUser.role !== 'student') {
        // Clear any invalid sessions
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
            SecurityUtils.clearSecureSession();
        }
        // Redirect to exam portal login page
        window.location.href = 'login.html';
        return;
    }
    
    // Display student name (sanitized)
    const studentNameEl = document.getElementById('studentName');
    if (studentNameEl) {
        const displayName = typeof SecurityUtils !== 'undefined' && SecurityUtils.escapeHtml ? 
            SecurityUtils.escapeHtml(currentUser.name) : currentUser.name;
        studentNameEl.textContent = `Welcome, ${displayName}`;
    }
    
    // Load available exams
    loadAvailableExams();
    
    // Load all results
    loadAllResults();
});

// Load available exams for student
async function loadAvailableExams() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get student's registered subjects
        const registeredSubjects = currentUser.courses || [];
        if (registeredSubjects.length === 0) {
            document.getElementById('examsList').innerHTML = '<p class="empty-state">You need to register for subjects first in the LMS portal</p>';
            return;
        }
        
        // Get active exams for student's class and registered subjects
        const { data: exams, error } = await client
            .from('exams')
            .select('*')
            .eq('is_active', true)
            .eq('class_id', currentUser.class)
            .in('subject', registeredSubjects);
        
        if (error) throw error;
        
        // Filter by date if applicable
        const now = new Date();
        const availableExams = (exams || []).filter(exam => {
            if (exam.start_date && new Date(exam.start_date) > now) return false;
            if (exam.end_date && new Date(exam.end_date) < now) return false;
            return true;
        });
        
        // Check which exams student has already taken
        const examIds = availableExams.map(e => e.id);
        const { data: attempts } = await client
            .from('student_exam_attempts')
            .select('exam_id, status, score, percentage')
            .eq('student_id', currentUser.id)
            .in('exam_id', examIds);
        
        const attemptsMap = {};
        (attempts || []).forEach(attempt => {
            attemptsMap[attempt.exam_id] = attempt;
        });
        
        displayAvailableExams(availableExams, attemptsMap);
        
    } catch (error) {
        console.error('Error loading available exams:', error);
        showError('Failed to load exams. Please refresh the page and try again.', 'Error Loading Exams');
    }
}

// Display available exams
function displayAvailableExams(exams, attemptsMap) {
    const examsListEl = document.getElementById('examsList');
    if (!examsListEl) return;
    
    if (exams.length === 0) {
        examsListEl.innerHTML = '<p class="empty-state">No exams available at the moment</p>';
        return;
    }
    
    examsListEl.innerHTML = exams.map(exam => {
        const attempt = attemptsMap[exam.id];
        const hasAttempted = attempt && (attempt.status === 'submitted' || attempt.status === 'auto_submitted' || attempt.status === 'time_expired');
        const canViewResults = exam.results_released && hasAttempted;
        
        return `
            <div class="card" style="margin-bottom: 20px;">
                <h3>${escapeHtml(exam.title)}</h3>
                <p style="color: #666; margin-bottom: 10px;">${escapeHtml(exam.description || 'No description')}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div><strong>Subject:</strong> ${escapeHtml(exam.subject)}</div>
                    <div><strong>Exam Type:</strong> ${formatExamTypeForStudent(exam.exam_type || 'N/A')} ${exam.exam_type ? `(${getExamTypePercentageForStudent(exam.exam_type)}%)` : ''}</div>
                    <div><strong>Duration:</strong> ${exam.duration_minutes} minutes</div>
                    <div><strong>Total Marks:</strong> ${exam.total_marks}</div>
                </div>
                ${hasAttempted ? `
                    ${canViewResults ? `
                        <div style="background: #e6f2ff; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                            <p><strong>Your Score:</strong> ${attempt.score || 0} / ${exam.total_marks}</p>
                            <p><strong>Percentage:</strong> ${attempt.percentage ? attempt.percentage.toFixed(1) : 0}%</p>
                        </div>
                        <button onclick="viewResults('${exam.id}')" class="btn btn-primary">View Results</button>
                    ` : `
                        <p style="color: orange; margin-bottom: 10px;">Exam completed. Results pending release.</p>
                    `}
                ` : `
                    <button onclick="startExam('${exam.id}')" class="btn btn-primary">Start Exam</button>
                `}
            </div>
        `;
    }).join('');
}

// Start exam
async function startExam(examId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showError('User session expired. Please log in again.', 'Session Expired');
        return;
    }
    
    // Check if student already has an active attempt
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data: existingAttempt } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('student_id', currentUser.id)
            .eq('exam_id', examId)
            .eq('status', 'in_progress')
            .maybeSingle();
        
        if (existingAttempt) {
            if (!confirm('You have an unfinished attempt. Do you want to continue?')) {
                return;
            }
            // Continue existing attempt
            await loadExamForAttempt(examId, existingAttempt.id);
            return;
        }
        
        // Get exam details
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        
        // Authorization check: Verify exam is for student's class
        if (!exam || exam.class_id !== currentUser.class) {
            showError('You do not have permission to take this exam. This exam is not for your class.', 'Access Denied');
            return;
        }
        
        // Authorization check: Verify student is registered for the exam's subject
        const registeredSubjects = currentUser.courses || [];
        if (!registeredSubjects.includes(exam.subject)) {
            showError('You do not have permission to take this exam. You are not registered for this subject.', 'Access Denied');
            return;
        }
        
        // Authorization check: Verify exam is active
        if (!exam.is_active) {
            showError('This exam is not currently active.', 'Exam Not Available');
            return;
        }
        
        // Get questions
        const { data: questionsData, error: questionsError } = await client
            .from('questions')
            .select('*')
            .eq('exam_id', examId)
            .order('sequence_order', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        if (!questionsData || questionsData.length === 0) {
            showError('This exam has no questions yet.', 'No Questions');
            return;
        }
        
        if (!confirm(`You have ${exam.duration_minutes} minutes to complete this exam. Once you start, the timer will begin. Continue?`)) {
            return;
        }
        
        // Create new attempt
        const durationSeconds = exam.duration_minutes * 60;
        const { data: attempt, error: attemptError } = await client
            .from('student_exam_attempts')
            .insert([{
                student_id: currentUser.id,
                exam_id: examId,
                status: 'in_progress',
                time_remaining_seconds: durationSeconds,
                total_marks: exam.total_marks
            }])
            .select()
            .single();
        
        if (attemptError) throw attemptError;
        
        // Randomize questions
        randomizedQuestions = shuffleArray([...questionsData]);
        
        // Initialize exam session
        currentExam = exam;
        currentAttempt = attempt;
        questions = questionsData;
        currentQuestionIndex = 0;
        answers = {};
        timeRemaining = durationSeconds;
        
        // Show exam taking view
        showExamTakingView();
        
        // Start timer
        startTimer();
        
        // Load first question
        loadQuestion(0);
        
    } catch (error) {
        console.error('Error starting exam:', error);
        showError('Failed to start exam. Please try again or contact support if the issue persists.', 'Error Starting Exam');
    }
}

// Load exam for existing attempt
async function loadExamForAttempt(examId, attemptId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get exam
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        
        // Get attempt
        const { data: attempt, error: attemptError } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('id', attemptId)
            .single();
        
        if (attemptError) throw attemptError;
        
        // Get questions
        const { data: questionsData, error: questionsError } = await client
            .from('questions')
            .select('*')
            .eq('exam_id', examId)
            .order('sequence_order', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        // Get existing responses to restore answers
        const { data: responses, error: responsesError } = await client
            .from('student_responses')
            .select('*')
            .eq('attempt_id', attemptId);
        
        if (responsesError) throw responsesError;
        
        // Restore randomized order from responses
        const questionOrder = (responses || []).sort((a, b) => a.sequence_order - b.sequence_order).map(r => r.question_id);
        randomizedQuestions = questionsData.sort((a, b) => {
            const indexA = questionOrder.indexOf(a.id);
            const indexB = questionOrder.indexOf(b.id);
            return indexA - indexB;
        });
        
        // Restore answers
        (responses || []).forEach(response => {
            answers[response.question_id] = response.student_answer;
        });
        
        // Find current question index
        const answeredQuestionIds = Object.keys(answers);
        currentQuestionIndex = randomizedQuestions.findIndex(q => !answeredQuestionIds.includes(q.id));
        if (currentQuestionIndex === -1) {
            currentQuestionIndex = randomizedQuestions.length;
        }
        
        currentExam = exam;
        currentAttempt = attempt;
        questions = questionsData;
        timeRemaining = attempt.time_remaining_seconds || (exam.duration_minutes * 60);
        
        // Show exam taking view
        showExamTakingView();
        
        // Start timer
        startTimer();
        
        // Initialize question navigation sidebar
        updateQuestionNavSidebar();
        
        // Load current question
        loadQuestion(currentQuestionIndex);
        
    } catch (error) {
        console.error('Error loading exam for attempt:', error);
        showError('Failed to load exam. Please refresh the page and try again.', 'Error Loading Exam');
    }
}

// Show exam taking view
function showExamTakingView() {
    document.getElementById('availableExamsView').style.display = 'none';
    document.getElementById('examTakingView').style.display = 'block';
    document.getElementById('resultsView').style.display = 'none';
    
    if (currentExam) {
        document.getElementById('examTitleHeader').textContent = currentExam.title;
        document.getElementById('totalMarksDisplay').textContent = currentExam.total_marks;
        document.getElementById('totalQuestions').textContent = randomizedQuestions.length;
    }
}

// Load question
function loadQuestion(index) {
    if (index < 0 || index >= randomizedQuestions.length) {
        return;
    }
    
    currentQuestionIndex = index;
    const question = randomizedQuestions[index];
    
    // Update question number
    document.getElementById('currentQuestionNum').textContent = index + 1;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = (index === 0);
    document.getElementById('nextBtn').style.display = (index < randomizedQuestions.length - 1) ? 'inline-block' : 'none';
    document.getElementById('submitBtn').style.display = (index === randomizedQuestions.length - 1) ? 'inline-block' : 'none';
    
    // Display question
    const container = document.getElementById('questionContainer');
    container.innerHTML = renderQuestion(question, index);
    
    // Restore answer if exists
    if (answers[question.id]) {
        restoreAnswer(question, answers[question.id]);
    }
    
    // Update question navigation sidebar
    updateQuestionNavSidebar();
}

// Toggle question navigation sidebar
function toggleQuestionNav() {
    const sidebar = document.getElementById('questionNavSidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Update question navigation sidebar
function updateQuestionNavSidebar() {
    const grid = document.getElementById('questionNavGrid');
    if (!grid || !randomizedQuestions) return;
    
    grid.innerHTML = randomizedQuestions.map((question, index) => {
        const isCurrent = index === currentQuestionIndex;
        const answer = answers[question.id];
        let statusClass = '';
        
        if (isCurrent) {
            statusClass = 'current';
        } else if (answer) {
            // Check if answer is complete
            if (question.question_type === 'short_answer' || question.question_type === 'essay') {
                statusClass = answer.trim().length > 0 ? 'answered' : 'incomplete';
            } else {
                statusClass = 'answered';
            }
        } else {
            statusClass = '';
        }
        
        return `<div class="question-nav-item ${statusClass}" onclick="jumpToQuestion(${index})">${index + 1}</div>`;
    }).join('');
}

// Jump to specific question
function jumpToQuestion(index) {
    if (index >= 0 && index < randomizedQuestions.length) {
        loadQuestion(index);
        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            toggleQuestionNav();
        }
    }
}

// Show auto-save indicator
function showAutoSaveIndicator(status) {
    const indicator = document.getElementById('autoSaveIndicator');
    const icon = document.getElementById('saveIcon');
    const text = document.getElementById('saveText');
    
    if (!indicator) return;
    
    indicator.classList.remove('hidden', 'saving', 'saved', 'error');
    
    if (status === 'saving') {
        indicator.classList.add('saving');
        icon.innerHTML = '<div class="save-spinner"></div>';
        text.textContent = 'Saving...';
    } else if (status === 'saved') {
        indicator.classList.add('saved');
        icon.textContent = '✓';
        text.textContent = 'Saved';
        // Hide after 2 seconds
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 2000);
    } else if (status === 'error') {
        indicator.classList.add('error');
        icon.textContent = '⚠';
        text.textContent = 'Save failed';
        // Hide after 3 seconds
        setTimeout(() => {
            indicator.classList.add('hidden');
        }, 3000);
    }
    
    indicator.classList.remove('hidden');
}

// Render question HTML
function renderQuestion(question, index) {
    let html = `
        <div class="question-number">Question ${index + 1} of ${randomizedQuestions.length}</div>
        <div class="question-text">${escapeHtml(question.question_text)}</div>
        <div class="answer-options">
    `;
    
    if (question.question_type === 'multiple_choice') {
        const options = parseQuestionOptions(question.options || '[]');
        options.forEach((option, optIndex) => {
            html += `
                <label class="answer-option">
                    <input type="radio" name="question_${question.id}" value="${escapeHtml(option)}" onchange="saveAnswer('${question.id}', '${escapeHtml(option)}')">
                    ${escapeHtml(option)}
                </label>
            `;
        });
    } else if (question.question_type === 'true_false') {
        html += `
            <label class="answer-option">
                <input type="radio" name="question_${question.id}" value="True" onchange="saveAnswer('${question.id}', 'True')">
                True
            </label>
            <label class="answer-option">
                <input type="radio" name="question_${question.id}" value="False" onchange="saveAnswer('${question.id}', 'False')">
                False
            </label>
        `;
    } else if (question.question_type === 'short_answer') {
        html += `
            <textarea 
                name="question_${question.id}" 
                class="form-control" 
                rows="3" 
                placeholder="Enter your answer"
                onchange="saveAnswer('${question.id}', this.value)"
                onblur="saveAnswer('${question.id}', this.value)"
            ></textarea>
        `;
    } else if (question.question_type === 'essay') {
        html += `
            <textarea 
                name="question_${question.id}" 
                class="form-control" 
                rows="8" 
                placeholder="Enter your answer"
                onchange="saveAnswer('${question.id}', this.value)"
                onblur="saveAnswer('${question.id}', this.value)"
            ></textarea>
        `;
    }
    
    html += '</div>';
    return html;
}

// Restore answer
function restoreAnswer(question, answer) {
    if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        const radio = document.querySelector(`input[name="question_${question.id}"][value="${escapeHtml(answer)}"]`);
        if (radio) {
            radio.checked = true;
            radio.closest('.answer-option')?.classList.add('selected');
        }
    } else {
        const textarea = document.querySelector(`textarea[name="question_${question.id}"]`);
        if (textarea) {
            textarea.value = answer;
        }
    }
}

// Save answer
function saveAnswer(questionId, answer) {
    answers[questionId] = answer;
    
    // Update visual feedback for radio buttons
    const radioInputs = document.querySelectorAll(`input[name="question_${questionId}"]`);
    radioInputs.forEach(radio => {
        const option = radio.closest('.answer-option');
        if (option) {
            option.classList.remove('selected');
            if (radio.checked) {
                option.classList.add('selected');
            }
        }
    });
    
    // Auto-save to database (debounced)
    debounceSaveAnswer(questionId, answer);
}

// Debounced save answer
let saveAnswerTimeout = null;
async function debounceSaveAnswer(questionId, answer) {
    clearTimeout(saveAnswerTimeout);
    saveAnswerTimeout = setTimeout(() => {
        saveAnswerToDatabase(questionId, answer);
    }, 1000);
}

// Save answer to database
async function saveAnswerToDatabase(questionId, answer) {
    if (!currentAttempt) return;
    
    // Show saving indicator
    showAutoSaveIndicator('saving');
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const questionIndex = randomizedQuestions.findIndex(q => q.id === questionId);
        
        // Check if response already exists
        const { data: existing } = await client
            .from('student_responses')
            .select('id')
            .eq('attempt_id', currentAttempt.id)
            .eq('question_id', questionId)
            .maybeSingle();
        
        if (existing) {
            // Update existing response
            await client
                .from('student_responses')
                .update({
                    student_answer: answer,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            // Insert new response
            await client
                .from('student_responses')
                .insert([{
                    attempt_id: currentAttempt.id,
                    question_id: questionId,
                    student_answer: answer,
                    sequence_order: questionIndex + 1
                }]);
        }
        
        // Show saved indicator
        showAutoSaveIndicator('saved');
        
        // Update navigation sidebar
        updateQuestionNavSidebar();
        
    } catch (error) {
        // Show error indicator instead of console.error
        showAutoSaveIndicator('error');
        if (typeof showError === 'function') {
            showError('Failed to save answer. Your answer is saved locally and will be synced when connection is restored.', 'Save Error');
        }
    }
}

// Next question
function nextQuestion() {
    if (currentQuestionIndex < randomizedQuestions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    }
}

// Previous question (disabled - one-way navigation)
function previousQuestion() {
    // Intentionally disabled - one-way navigation only
    showError('You cannot go back to previous questions', 'Navigation Restricted');
}

// Start timer
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        // Update time remaining in database every 30 seconds
        if (timeRemaining % 30 === 0) {
            updateTimeRemaining();
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        } else if (timeRemaining <= 300) { // 5 minutes warning
            document.getElementById('timerText').classList.add('timer-warning');
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('timerText').textContent = timeString;
    document.getElementById('timeRemainingDisplay').textContent = timeString;
}

// Update time remaining in database
async function updateTimeRemaining() {
    if (!currentAttempt) return;
    
    try {
        const client = getSupabaseClient();
        if (!client) return;
        
        await client
            .from('student_exam_attempts')
            .update({ time_remaining_seconds: timeRemaining })
            .eq('id', currentAttempt.id);
        
    } catch (error) {
        // Silently fail - time update is not critical, timer continues locally
        // Don't interrupt student's exam flow
    }
}

// Submit exam
async function submitExam() {
    if (!confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
        return;
    }
    
    await finalizeExam('submitted');
}

// Auto-submit exam (when time expires)
async function autoSubmitExam() {
    showError('Time is up! Your exam has been automatically submitted.', 'Time Expired');
    await finalizeExam('time_expired');
}

// Finalize exam (submit and grade)
async function finalizeExam(status) {
    if (!currentAttempt || !currentExam) return;
    
    clearInterval(timerInterval);
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get current user for authorization check
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'student') {
            showError('You must be logged in as a student to submit exams.', 'Authorization Required');
            return;
        }
        
        // Authorization check: Verify attempt belongs to current student
        const { data: attempt, error: attemptError } = await client
            .from('student_exam_attempts')
            .select('student_id, exam_id')
            .eq('id', currentAttempt.id)
            .single();
        
        if (attemptError) throw attemptError;
        if (!attempt || attempt.student_id !== currentUser.id) {
            showError('You do not have permission to submit this exam attempt.', 'Access Denied');
            return;
        }
        
        // Grade all answers
        const { data: responses } = await client
            .from('student_responses')
            .select('*, questions(*)')
            .eq('attempt_id', currentAttempt.id);
        
        let totalScore = 0;
        let totalMarks = 0;
        
        // Grade each response
        for (const response of (responses || [])) {
            const question = response.questions;
            totalMarks += question.marks;
            
            let isCorrect = false;
            let marksAwarded = 0;
            
            if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                isCorrect = response.student_answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
                marksAwarded = isCorrect ? question.marks : 0;
            } else {
                // For short_answer and essay, auto-grade if exact match, otherwise 0
                // In production, you might want manual grading for essays
                isCorrect = response.student_answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
                marksAwarded = isCorrect ? question.marks : 0;
            }
            
            totalScore += marksAwarded;
            
            // Update response with grading
            await client
                .from('student_responses')
                .update({
                    is_correct: isCorrect,
                    marks_awarded: marksAwarded
                })
                .eq('id', response.id);
        }
        
        const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
        
        // Update attempt
        await client
            .from('student_exam_attempts')
            .update({
                status: status,
                submitted_at: new Date().toISOString(),
                time_remaining_seconds: timeRemaining,
                score: totalScore,
                total_marks: totalMarks,
                percentage: percentage
            })
            .eq('id', currentAttempt.id);
        
        // Calculate scaled score based on exam type percentage
        const examTypePercentage = getExamTypePercentageForStudent(currentExam.exam_type);
        const scaledScore = (percentage * examTypePercentage) / 100;
        
        // Create grade record with scaling
        await client
            .from('exam_grades')
            .upsert([{
                student_id: getCurrentUser().id,
                exam_id: currentExam.id,
                attempt_id: currentAttempt.id,
                score: totalScore,
                percentage: percentage,
                grade: calculateGrade(percentage),
                scaling_percentage: examTypePercentage,
                scaled_score: scaledScore
            }], {
                onConflict: 'student_id,exam_id'
            });
        
        // Show results if released
        if (currentExam.results_released) {
            showResults(totalScore, totalMarks, percentage);
        } else {
            showInfo('Exam submitted successfully! Results will be available once released by your lecturer.', 'Exam Submitted');
            setTimeout(() => {
                goBackToExams();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error submitting exam:', error);
        showError('Failed to submit exam. Please try again. If the issue persists, contact your lecturer.', 'Error Submitting Exam');
    }
}

// Calculate grade
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 40) return 'D';
    return 'F';
}

// Show detailed results with question breakdown
function showDetailedResults(attempt, exam, questions, responseMap) {
    document.getElementById('availableExamsView').style.display = 'none';
    document.getElementById('examTakingView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'block';
    
    const score = attempt.score || 0;
    const totalMarks = exam.total_marks || 0;
    const percentage = attempt.percentage || 0;
    const grade = calculateGrade(percentage);
    
    // Update summary stats
    document.getElementById('resultsExamTitle').textContent = exam.title;
    document.getElementById('resultsScore').textContent = score;
    document.getElementById('resultsTotal').textContent = totalMarks;
    document.getElementById('resultsPercentage').textContent = percentage.toFixed(1) + '%';
    
    // Add grade display
    const resultsContent = document.getElementById('resultsView').querySelector('.dashboard-content');
    if (resultsContent) {
        // Check if detailed results already exist
        let detailedSection = document.getElementById('detailedResultsSection');
        if (!detailedSection) {
            detailedSection = document.createElement('div');
            detailedSection.id = 'detailedResultsSection';
            detailedSection.className = 'card';
            detailedSection.style.marginTop = '20px';
            resultsContent.appendChild(detailedSection);
        }
        
        // Grade badge
        const gradeColors = {
            A: '#28a745',
            B: '#17a2b8',
            C: '#ffc107',
            D: '#fd7e14',
            F: '#dc3545'
        };
        
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h3 style="margin: 0;">Exam Results</h3>
                <div style="display: flex; gap: 10px;">
                    <button onclick="exportMyResultPDF('${exam.id}', '${escapeHtml(exam.title || '').replace(/'/g, "\\'")}')" class="btn btn-danger" style="padding: 8px 16px; font-size: 14px; min-width: 120px; display: inline-block;" title="Download Results as PDF">
                        📄 Download PDF
                    </button>
                </div>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, ${gradeColors[grade]} 0%, ${gradeColors[grade]}dd 100%); border-radius: 10px; color: white;">
                <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">${grade}</div>
                <div style="font-size: 18px;">Grade</div>
            </div>
            
            <h3 style="margin-bottom: 20px;">Question Breakdown</h3>
            <div id="questionBreakdown">
        `;
        
        // Show each question with answer comparison
        questions.forEach((question, index) => {
            const studentAnswer = responseMap[question.id] || 'Not answered';
            const correctAnswer = question.correct_answer;
            const isCorrect = checkAnswerCorrect(question, studentAnswer, correctAnswer);
            
            html += `
                <div class="question-item" style="margin-bottom: 20px; border-left: 4px solid ${isCorrect ? '#28a745' : '#dc3545'};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: var(--primary-color);">Question ${index + 1}</h4>
                        <span style="background: ${isCorrect ? '#28a745' : '#dc3545'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                    </div>
                    <p style="font-weight: 600; margin-bottom: 10px;">${escapeHtml(question.question_text)}</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                        <div style="color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Your Answer:</strong></div>
                        <div style="color: ${isCorrect ? '#28a745' : '#dc3545'}; font-weight: 600;">${escapeHtml(studentAnswer)}</div>
                    </div>
                    <div style="background: #e6f2ff; padding: 15px; border-radius: 5px;">
                        <div style="color: #666; font-size: 14px; margin-bottom: 5px;"><strong>Correct Answer:</strong></div>
                        <div style="color: var(--primary-color); font-weight: 600;">${escapeHtml(correctAnswer)}</div>
                    </div>
                    ${question.question_type === 'multiple_choice' && question.options ? `
                        <div style="margin-top: 10px; font-size: 12px; color: #666;">
                            Options: ${parseQuestionOptions(question.options).map(opt => escapeHtml(opt)).join(', ')}
                        </div>
                    ` : ''}
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        <strong>Marks:</strong> ${isCorrect ? question.marks : 0} / ${question.marks}
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
        `;
        
        detailedSection.innerHTML = html;
    }
}

// Check if answer is correct
function checkAnswerCorrect(question, studentAnswer, correctAnswer) {
    if (!studentAnswer || studentAnswer.trim() === '') return false;
    
    // For multiple choice and true/false, exact match
    if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        return studentAnswer.trim() === correctAnswer.trim();
    }
    
    // For short answer and essay, case-insensitive partial match
    // (In a real system, you might want more sophisticated matching)
    if (question.question_type === 'short_answer' || question.question_type === 'essay') {
        const studentLower = studentAnswer.trim().toLowerCase();
        const correctLower = correctAnswer.trim().toLowerCase();
        return studentLower.includes(correctLower) || correctLower.includes(studentLower);
    }
    
    return false;
}

// Show results (backward compatibility)
function showResults(score, totalMarks, percentage) {
    document.getElementById('availableExamsView').style.display = 'none';
    document.getElementById('examTakingView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'block';
    
    document.getElementById('resultsExamTitle').textContent = currentExam.title;
    document.getElementById('resultsScore').textContent = score;
    document.getElementById('resultsTotal').textContent = totalMarks;
    document.getElementById('resultsPercentage').textContent = percentage.toFixed(1) + '%';
}

// View results for completed exam
async function viewResults(examId) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        showError('You must be logged in as a student to view results.', 'Authorization Required');
        return;
    }
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get attempt - already filtered by student_id for authorization
        const { data: attempt } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('student_id', currentUser.id) // Authorization: Only current student's attempts
            .eq('exam_id', examId)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (!attempt) {
            showError('No results found for this exam.', 'No Results');
            return;
        }
        
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError) throw examError;
        if (!exam) {
            throw new Error('Exam not found');
        }
        
        // Get all questions for this exam
        const { data: questions, error: questionsError } = await client
            .from('questions')
            .select('*')
            .eq('exam_id', examId)
            .order('sequence_order', { ascending: true });
        
        if (questionsError) {
            console.warn('Error loading questions:', questionsError);
            // Continue with empty questions array
        }
        
        // Get student responses
        const { data: responses, error: responsesError } = await client
            .from('student_responses')
            .select('*')
            .eq('attempt_id', attempt.id);
        
        if (responsesError) {
            console.warn('Error loading responses:', responsesError);
            // Continue with empty responses
        }
        
        // Create response map
        const responseMap = {};
        (responses || []).forEach(r => {
            if (r && r.question_id) {
                responseMap[r.question_id] = r.student_answer || 'Not answered';
            }
        });
        
        currentExam = exam;
        showDetailedResults(attempt, exam, questions || [], responseMap);
        
    } catch (error) {
        console.error('Error loading exam results:', error);
        showError('Failed to load results: ' + (error.message || 'Please refresh the page and try again.'), 'Error Loading Results');
    }
}

// Show exams tab
function showExamsTab() {
    document.getElementById('availableExamsView').style.display = 'block';
    const myResultsView = document.getElementById('myResultsView');
    if (myResultsView) myResultsView.style.display = 'none';
    document.getElementById('examTakingView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'none';
    
    // Update tab buttons
    const examsTab = document.getElementById('examsTab');
    const resultsTab = document.getElementById('resultsTab');
    if (examsTab && resultsTab) {
        examsTab.classList.remove('btn-secondary');
        examsTab.classList.add('btn-primary');
        resultsTab.classList.remove('btn-primary');
        resultsTab.classList.add('btn-secondary');
    }
    
    // Reload exams
    loadAvailableExams();
}

// Show results tab
function showResultsTab() {
    document.getElementById('availableExamsView').style.display = 'none';
    const myResultsView = document.getElementById('myResultsView');
    if (myResultsView) myResultsView.style.display = 'block';
    document.getElementById('examTakingView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'none';
    
    // Update tab buttons
    const examsTab = document.getElementById('examsTab');
    const resultsTab = document.getElementById('resultsTab');
    if (examsTab && resultsTab) {
        resultsTab.classList.remove('btn-secondary');
        resultsTab.classList.add('btn-primary');
        examsTab.classList.remove('btn-primary');
        examsTab.classList.add('btn-secondary');
    }
    
    // Reload all results
    loadAllResults();
}

// Load all exam results for student
async function loadAllResults() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        console.error('Unauthorized access attempt to load results');
        return;
    }
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get all completed exam attempts - filtered by student_id for authorization
        const { data: attempts, error } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('student_id', currentUser.id)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('submitted_at', { ascending: false });
        
        if (error) throw error;
        
        const resultsListEl = document.getElementById('allResultsList');
        if (!resultsListEl) return;
        
        if (!attempts || attempts.length === 0) {
            resultsListEl.innerHTML = `
                <div class="card">
                    <p class="empty-state" style="text-align: center; padding: 40px;">
                        No exam results available yet.<br>
                        Complete an exam to see your results here.
                    </p>
                </div>
            `;
            return;
        }
        
        // Get exam details for each attempt
        const examIds = [...new Set(attempts.map(a => a.exam_id))];
        const { data: exams } = await client
            .from('exams')
            .select('*')
            .in('id', examIds);
        
        const examMap = {};
        (exams || []).forEach(exam => {
            examMap[exam.id] = exam;
        });
        
        displayAllResults(attempts, examMap);
        
    } catch (error) {
        console.error('Error loading all results:', error);
        showError('Failed to load results. Please refresh the page and try again.', 'Error Loading Results');
    }
}

// Display all results
function displayAllResults(attempts, examMap) {
    const resultsListEl = document.getElementById('allResultsList');
    if (!resultsListEl) return;
    
    const gradeColors = {
        A: '#28a745',
        B: '#17a2b8',
        C: '#ffc107',
        D: '#fd7e14',
        F: '#dc3545'
    };
    
    resultsListEl.innerHTML = attempts.map(attempt => {
        const exam = examMap[attempt.exam_id];
        if (!exam) return '';
        
        const percentage = attempt.percentage || 0;
        const grade = calculateGrade(percentage);
        const submittedDate = attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A';
        const canViewDetails = exam.results_released;
        
        return `
            <div class="card" style="margin-bottom: 20px; border-left: 4px solid ${gradeColors[grade]};">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin-bottom: 10px; color: var(--primary-color);">${escapeHtml(exam.title)}</h3>
                        <p style="color: #666; margin-bottom: 10px;">${escapeHtml(exam.description || 'No description')}</p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px; font-size: 14px;">
                            <div><strong>Subject:</strong> ${escapeHtml(exam.subject)}</div>
                            <div><strong>Class:</strong> ${formatClassName(exam.class_id)}</div>
                            <div><strong>Submitted:</strong> ${submittedDate.split(',')[0]}</div>
                        </div>
                        <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                            <div style="background: ${gradeColors[grade]}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px;">
                                ${grade}
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">
                                    ${attempt.score || 0} / ${exam.total_marks}
                                </div>
                                <div style="font-size: 14px; color: #666;">${percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                        <div style="margin-top: 10px; font-size: 12px; color: #666;">
                            Status: ${attempt.status === 'time_expired' ? '⏱ Time Expired' : attempt.status === 'auto_submitted' ? '🤖 Auto-Submitted' : '✓ Submitted'}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${canViewDetails ? `
                            <button onclick="viewResults('${exam.id}')" class="btn btn-primary" style="width: auto; min-width: 150px;">
                                View Details
                            </button>
                            <button onclick="exportMyResultPDF('${exam.id}', ${JSON.stringify(exam.title)})" class="btn btn-danger" style="width: auto; min-width: 150px; font-size: 12px; padding: 6px 12px;" title="Download Results as PDF">
                                📄 Download PDF
                            </button>
                        ` : `
                            <div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; text-align: center; font-size: 14px;">
                                ⏳ Results Pending
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Format class name
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

// Go back to exams list
function goBackToExams() {
    showExamsTab();
    
    // Reset state
    currentExam = null;
    currentAttempt = null;
    questions = [];
    randomizedQuestions = [];
    currentQuestionIndex = 0;
    answers = {};
    clearInterval(timerInterval);
    
    // Reload exams
    loadAvailableExams();
}

// Helper functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export student's own result to PDF
async function exportMyResultPDF(examId, examTitle = 'My Exam Result') {
    console.log('exportMyResultPDF called with:', examId, examTitle);
    
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        const errorMsg = 'Only students can export their own results.';
        if (typeof showError === 'function') {
            showError(errorMsg, 'Authorization Required');
        } else if (typeof alert === 'function') {
            alert('Authorization Required: ' + errorMsg);
        } else {
            console.error('Authorization Required:', errorMsg);
        }
        return;
    }
    
    try {
        // Show loading message
        if (typeof showInfo === 'function') {
            showInfo('Preparing PDF download...', 'Loading');
        }
        
        // Check if jsPDF is available
        let jsPDF;
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
        } else if (typeof window.jsPDF !== 'undefined') {
            jsPDF = window.jsPDF;
        } else {
            // Load jsPDF from CDN (try both CDNs for better reliability)
            try {
                console.log('Loading jsPDF from CDN...');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                // Wait a bit for the library to initialize
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try to access jsPDF after loading
                if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                    jsPDF = window.jspdf.jsPDF;
                } else if (typeof window.jsPDF !== 'undefined') {
                    jsPDF = window.jsPDF;
                } else {
                    throw new Error('jsPDF not found after loading');
                }
            } catch (cdnError) {
                // Fallback to alternative CDN
                console.warn('First CDN failed, trying alternative:', cdnError);
                await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                    jsPDF = window.jspdf.jsPDF;
                } else if (typeof window.jsPDF !== 'undefined') {
                    jsPDF = window.jsPDF;
                } else {
                    throw new Error('jsPDF library failed to load. Please check your internet connection and try again.');
                }
            }
        }
        
        if (!jsPDF) {
            throw new Error('jsPDF library not available');
        }
        
        console.log('jsPDF loaded successfully:', typeof jsPDF);
        
        // Get exam and student's attempt
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
        
        if (examError || !exam) {
            throw new Error('Exam not found');
        }
        
        // Get student's attempt
        const { data: attempts, error: attemptError } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .eq('student_id', currentUser.id)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('submitted_at', { ascending: false })
            .limit(1);
        
        if (attemptError || !attempts || attempts.length === 0) {
            throw new Error('No attempt found for this exam');
        }
        
        const attempt = attempts[0];
        
        // Get questions
        const { data: questions, error: questionsError } = await client
            .from('questions')
            .select('*')
            .eq('exam_id', examId)
            .order('sequence_order', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        // Parse responses
        const responseMap = attempt.responses ? JSON.parse(attempt.responses) : {};
        
        // Create PDF
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text(examTitle, 14, 20);
        doc.setFontSize(12);
        doc.text(`Student: ${currentUser.name}`, 14, 30);
        doc.text(`Subject: ${exam.subject}`, 14, 36);
        doc.text(`Class: ${formatClassName(exam.class_id)}`, 14, 42);
        doc.text(`Date: ${new Date(attempt.submitted_at).toLocaleDateString()}`, 14, 48);
        
        // Results Summary
        doc.setFontSize(14);
        doc.text('Results Summary', 14, 58);
        doc.setFontSize(12);
        const score = attempt.score || 0;
        const percentage = attempt.percentage || 0;
        const grade = calculateGrade(percentage);
        doc.text(`Score: ${score} / ${exam.total_marks}`, 14, 66);
        doc.text(`Percentage: ${percentage.toFixed(1)}%`, 14, 72);
        doc.text(`Grade: ${grade}`, 14, 78);
        
        // Question Breakdown
        let yPos = 88;
        doc.setFontSize(14);
        doc.text('Question Breakdown', 14, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        questions.forEach((question, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            const studentAnswer = responseMap[question.id] || 'Not answered';
            const correctAnswer = question.correct_answer;
            const isCorrect = checkAnswerCorrect(question, studentAnswer, correctAnswer);
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`Question ${index + 1}${isCorrect ? ' ✓' : ' ✗'}`, 14, yPos);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            const questionLines = doc.splitTextToSize(question.question_text, 180);
            doc.text(questionLines, 14, yPos);
            yPos += questionLines.length * 5;
            
            doc.text(`Your Answer: ${studentAnswer}`, 20, yPos);
            yPos += 5;
            doc.text(`Correct Answer: ${correctAnswer}`, 20, yPos);
            yPos += 5;
            doc.text(`Marks: ${isCorrect ? question.marks : 0} / ${question.marks}`, 20, yPos);
            yPos += 8;
        });
        
        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
        }
        
        // Save PDF
        const fileName = `${examTitle.replace(/[^a-z0-9]/gi, '_')}_Result_${currentUser.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        // Show success message (with fallback)
        if (typeof showSuccess === 'function') {
            showSuccess('Results exported successfully!', 'Export Complete');
        } else if (typeof alert === 'function') {
            alert('Results exported successfully!');
        } else {
            console.log('Results exported successfully!');
        }
    } catch (error) {
        console.error('Error exporting result:', error);
        // Show error message (with fallback)
        if (typeof showError === 'function') {
            showError('Failed to export results: ' + (error.message || 'Unknown error'), 'Export Error');
        } else if (typeof alert === 'function') {
            alert('Export Error: ' + (error.message || 'Failed to export results'));
        } else {
            console.error('Export Error:', error);
        }
    }
}

// Helper function to load script dynamically
function loadScript(url) {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            console.log('Script already loaded:', url);
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log('Script loaded successfully:', url);
            resolve();
        };
        script.onerror = (error) => {
            console.error('Script loading failed:', url, error);
            reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
    });
}

// Get exam type percentage weight (for students)
function getExamTypePercentageForStudent(examType) {
    const percentages = {
        'opening_exam': 5,
        'quiz': 5,
        'bft': 5,
        'mid_course_exercise': 15,
        'mid_cs_exam': 20,
        'gen_assessment': 5,
        'final_cse_exercise': 20,
        'final_exam': 25
    };
    return percentages[examType] || 0;
}

// Format exam type for display (for students)
function formatExamTypeForStudent(examType) {
    if (!examType) return 'N/A';
    const types = {
        'opening_exam': 'Opening Exam',
        'quiz': 'Quiz',
        'bft': 'BFT (Written 2x Compulsory)',
        'mid_course_exercise': 'Mid Course Exercise',
        'mid_cs_exam': 'Mid CS Exam',
        'gen_assessment': 'Gen Assessment',
        'final_cse_exercise': 'Final CSE Exercise',
        'final_exam': 'Final Exam'
    };
    return types[examType] || examType;
}

// Make function globally accessible
if (typeof window !== 'undefined') {
    window.exportMyResultPDF = exportMyResultPDF;
}
