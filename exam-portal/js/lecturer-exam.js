// Lecturer Exam Portal JavaScript

let currentExamId = null;
let currentQuestions = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    let currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'lecturer') {
        window.location.href = '../index.html';
        return;
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
});

// Populate subject dropdown with lecturer's registered subjects
function populateExamSubjectDropdown() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.courses || currentUser.courses.length === 0) {
        showError('Please register for subjects in the LMS portal first', 'No Subjects Registered');
        return;
    }
    
    const subjectSelect = document.getElementById('examSubject');
    if (!subjectSelect) return;
    
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    // Get unique subjects from all classes
    const allSubjects = new Set();
    const registeredSubjects = currentUser.courses || [];
    
    registeredSubjects.forEach(subject => {
        allSubjects.add(subject);
    });
    
    Array.from(allSubjects).sort().forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
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
        console.error('Error creating exam:', error);
        showError('Failed to create exam: ' + (error.message || 'Unknown error'), 'Error');
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
        showError('Failed to load exams: ' + (error.message || 'Unknown error'), 'Error');
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
        console.error('Error loading exam details:', error);
        showError('Failed to load exam details: ' + (error.message || 'Unknown error'), 'Error');
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

// Add question (simplified - will be expanded)
function addQuestion(examId) {
    const questionType = prompt('Question Type:\n1. Multiple Choice\n2. True/False\n3. Short Answer\n4. Essay\n\nEnter number:');
    if (!questionType) return;
    
    const types = {
        '1': 'multiple_choice',
        '2': 'true_false',
        '3': 'short_answer',
        '4': 'essay'
    };
    
    const selectedType = types[questionType];
    if (!selectedType) {
        showError('Invalid question type', 'Error');
        return;
    }
    
    // For now, show a simple prompt - will be expanded to full form
    const questionText = prompt('Enter question text:');
    if (!questionText) return;
    
    const marks = parseInt(prompt('Enter marks for this question:') || '1');
    
    let correctAnswer = '';
    let options = null;
    
    if (selectedType === 'multiple_choice') {
        const option1 = prompt('Option 1:');
        const option2 = prompt('Option 2:');
        const option3 = prompt('Option 3 (optional):');
        const option4 = prompt('Option 4 (optional):');
        
        options = [option1, option2];
        if (option3) options.push(option3);
        if (option4) options.push(option4);
        
        correctAnswer = prompt('Correct answer (enter the option text):');
    } else if (selectedType === 'true_false') {
        correctAnswer = prompt('Correct answer (True/False):');
    } else {
        correctAnswer = prompt('Correct answer (for grading reference):');
    }
    
    if (!correctAnswer) {
        showError('Correct answer is required', 'Error');
        return;
    }
    
    saveQuestion(examId, {
        question_text: questionText,
        question_type: selectedType,
        options: selectedType === 'multiple_choice' ? JSON.stringify(options) : null,
        correct_answer: correctAnswer,
        marks: marks,
        sequence_order: currentQuestions.length + 1
    });
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
        showError('Failed to save question: ' + (error.message || 'Unknown error'), 'Error');
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
        console.error('Error toggling exam status:', error);
        showError('Failed to update exam status: ' + (error.message || 'Unknown error'), 'Error');
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
        console.error('Error releasing results:', error);
        showError('Failed to release results: ' + (error.message || 'Unknown error'), 'Error');
    }
}

// View exam statistics
async function viewExamStats(examId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data: attempts, error } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .eq('status', 'submitted');
        
        if (error) throw error;
        
        const totalAttempts = attempts.length;
        const avgScore = totalAttempts > 0 ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts : 0;
        const avgPercentage = totalAttempts > 0 ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts : 0;
        
        showInfo(
            `Exam Statistics:\n\nTotal Submissions: ${totalAttempts}\nAverage Score: ${avgScore.toFixed(1)}\nAverage Percentage: ${avgPercentage.toFixed(1)}%`,
            'Exam Statistics'
        );
        
    } catch (error) {
        console.error('Error loading exam stats:', error);
        showError('Failed to load statistics: ' + (error.message || 'Unknown error'), 'Error');
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

// Placeholder functions (to be implemented)
function editQuestion(questionId) {
    showInfo('Edit question functionality will be implemented', 'Coming Soon');
}

function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    // Implement delete functionality
    showInfo('Delete question functionality will be implemented', 'Coming Soon');
}

