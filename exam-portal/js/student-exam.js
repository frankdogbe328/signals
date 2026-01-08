// Student Exam Portal JavaScript

let currentExam = null;
let currentAttempt = null;
let questions = [];
let randomizedQuestions = [];
let currentQuestionIndex = 0;
let answers = {}; // Store answers: { questionId: answer }
let timerInterval = null;
let timeRemaining = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    let currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        // Redirect to login with redirect parameter to come back here
        window.location.href = '../index.html?redirect=exam-portal/student-exam-portal.html';
        return;
    }
    
    // Display student name
    const studentNameEl = document.getElementById('studentName');
    if (studentNameEl) {
        studentNameEl.textContent = `Welcome, ${currentUser.name}`;
    }
    
    // Load available exams
    loadAvailableExams();
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
        console.error('Error loading exams:', error);
        showError('Failed to load exams: ' + (error.message || 'Unknown error'), 'Error');
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
        showError('Failed to start exam: ' + (error.message || 'Unknown error'), 'Error');
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
        
        // Load current question
        loadQuestion(currentQuestionIndex);
        
    } catch (error) {
        console.error('Error loading exam attempt:', error);
        showError('Failed to load exam: ' + (error.message || 'Unknown error'), 'Error');
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
}

// Render question HTML
function renderQuestion(question, index) {
    let html = `
        <div class="question-number">Question ${index + 1} of ${randomizedQuestions.length}</div>
        <div class="question-text">${escapeHtml(question.question_text)}</div>
        <div class="answer-options">
    `;
    
    if (question.question_type === 'multiple_choice') {
        const options = JSON.parse(question.options || '[]');
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
        
    } catch (error) {
        console.error('Error saving answer:', error);
        // Don't show error to user, just log it
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
        console.error('Error updating time:', error);
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
        
        // Create grade record
        await client
            .from('exam_grades')
            .upsert([{
                student_id: getCurrentUser().id,
                exam_id: currentExam.id,
                attempt_id: currentAttempt.id,
                score: totalScore,
                percentage: percentage,
                grade: calculateGrade(percentage)
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
        console.error('Error finalizing exam:', error);
        showError('Failed to submit exam: ' + (error.message || 'Unknown error'), 'Error');
    }
}

// Calculate grade
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

// Show results
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
    if (!currentUser) return;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data: attempt } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('student_id', currentUser.id)
            .eq('exam_id', examId)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (!attempt) {
            showError('No results found', 'Error');
            return;
        }
        
        const { data: exam } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        currentExam = exam;
        showResults(attempt.score || 0, attempt.total_marks || 0, attempt.percentage || 0);
        
    } catch (error) {
        console.error('Error loading results:', error);
        showError('Failed to load results: ' + (error.message || 'Unknown error'), 'Error');
    }
}

// Go back to exams list
function goBackToExams() {
    document.getElementById('availableExamsView').style.display = 'block';
    document.getElementById('examTakingView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'none';
    
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

