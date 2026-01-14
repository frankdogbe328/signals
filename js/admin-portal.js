// Admin Portal JavaScript

let allResults = [];
let allStudents = [];
let allExams = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    let currentUser = null;
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.getSecureSession) {
        const session = SecurityUtils.getSecureSession();
        if (session && session.user) {
            currentUser = session.user;
        }
    }
    if (!currentUser) {
        currentUser = getCurrentUser();
    }
    
    if (!currentUser || currentUser.role !== 'admin') {
        // Redirect to dedicated admin login page
        if (typeof SecurityUtils !== 'undefined' && SecurityUtils.clearSecureSession) {
            SecurityUtils.clearSecureSession();
        }
        localStorage.removeItem('currentUser');
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Display admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = `Admin: ${currentUser.name || currentUser.username}`;
    }
    
    // Load initial data
    loadStatistics();
    loadResults();
    loadFinalGrades();
    
    // Populate subject dropdown based on class
    document.getElementById('filterClass').addEventListener('change', function() {
        updateSubjectDropdown(this.value);
    });
});

// Load all students (even without exam results)
async function loadAllStudents() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        const { data: students, error } = await supabase
            .from('users')
            .select('id, username, name, class, email, created_at')
            .eq('role', 'student')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading students:', error);
            return;
        }
        
        allStudents = students || [];
        console.log(`Loaded ${allStudents.length} students`);
        
    } catch (error) {
        console.error('Error loading all students:', error);
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get total students
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('role', 'student');
        
        // Get total exams
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select('id', { count: 'exact' });
        
        // Get completed exam attempts
        const { data: attempts, error: attemptsError } = await supabase
            .from('student_exam_attempts')
            .select('id', { count: 'exact' })
            .eq('status', 'submitted');
        
        // Get released results count
        const { data: releasedExams, error: releasedError } = await supabase
            .from('exams')
            .select('id', { count: 'exact' })
            .eq('results_released', true);
        
        document.getElementById('totalStudents').textContent = students?.length || 0;
        document.getElementById('totalExams').textContent = exams?.length || 0;
        document.getElementById('completedExams').textContent = attempts?.length || 0;
        document.getElementById('resultsReleased').textContent = releasedExams?.length || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Update subject dropdown based on selected class
function updateSubjectDropdown(classId) {
    const subjectSelect = document.getElementById('filterSubject');
    if (!subjectSelect) return;
    
    if (classId === 'all') {
        subjectSelect.innerHTML = '<option value="all">All Subjects</option>';
        return;
    }
    
    const subjects = getCoursesForClass(classId);
    subjectSelect.innerHTML = '<option value="all">All Subjects</option>' +
        subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('');
    
    loadResults();
}

// Load all results
async function loadResults() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        // Reload students to get latest
        await loadAllStudents();
        
        const classFilter = document.getElementById('filterClass').value;
        const subjectFilter = document.getElementById('filterSubject').value;
        const studentFilter = document.getElementById('filterStudent').value.toLowerCase();
        
        // Build query for exam grades
        let query = supabase
            .from('exam_grades')
            .select(`
                *,
                student:users!exam_grades_student_id_fkey(id, name, username, class),
                exam:exams!exam_grades_exam_id_fkey(
                    id,
                    title,
                    subject,
                    class_id,
                    total_marks,
                    lecturer_id,
                    results_released,
                    lecturer:users!exams_lecturer_id_fkey(id, name, username)
                )
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters
        if (classFilter !== 'all') {
            // Filter by class through student
            const { data: studentsInClass } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'student')
                .eq('class', classFilter);
            
            const studentIds = studentsInClass?.map(s => s.id) || [];
            if (studentIds.length > 0) {
                query = query.in('student_id', studentIds);
            } else {
                // No students in this class, but still show students without results
                allResults = [];
                displayResultsGroupedByClass([]);
                return;
            }
        }
        
        const { data: grades, error } = await query;
        
        if (error) {
            console.error('Error loading results:', error);
            showError('Failed to load results. Please try again.', 'Error');
            return;
        }
        
        allResults = grades || [];
        
        // Apply client-side filters
        let filteredResults = allResults;
        
        if (subjectFilter !== 'all') {
            filteredResults = filteredResults.filter(r => r.exam?.subject === subjectFilter);
        }
        
        // Note: Student filter is now handled in displayResultsGroupedByClass
        // to include students without results
        
        // Group results by class for better organization (includes all students)
        displayResultsGroupedByClass(filteredResults);
        
    } catch (error) {
        console.error('Error loading results:', error);
        showError('Failed to load results. Please try again.', 'Error');
    }
}

// Display results grouped by class (including students without results)
function displayResultsGroupedByClass(results) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    
    // Check if there are unreleased results
    const hasUnreleased = results.some(r => !r.exam?.results_released);
    document.getElementById('releaseAllBtn').style.display = hasUnreleased ? 'block' : 'none';
    
    // Get filter values
    const classFilter = document.getElementById('filterClass').value;
    const subjectFilter = document.getElementById('filterSubject').value;
    const studentFilter = document.getElementById('filterStudent').value.toLowerCase().trim();
    
    // Group all students by class (including those without exam results)
    const classGroups = {};
    
    // First, add all students (even without results)
    allStudents.forEach(student => {
        const classId = student.class || 'unknown';
        
        // Apply class filter
        if (classFilter !== 'all' && classId !== classFilter) {
            return;
        }
        
        // Apply student name filter
        if (studentFilter) {
            const studentName = (student.name || '').toLowerCase();
            const studentUsername = (student.username || '').toLowerCase();
            const matches = studentName.includes(studentFilter) || 
                          studentUsername.includes(studentFilter) ||
                          studentName.split(' ').some(part => part.startsWith(studentFilter)) ||
                          studentUsername.split(' ').some(part => part.startsWith(studentFilter));
            if (!matches) return;
        }
        
        if (!classGroups[classId]) {
            classGroups[classId] = {
                students: {},
                results: []
            };
        }
        
        // Initialize student entry
        if (!classGroups[classId].students[student.id]) {
            classGroups[classId].students[student.id] = {
                student: student,
                results: []
            };
        }
    });
    
    // Then, add exam results
    results.forEach(result => {
        const student = result.student || {};
        const classId = student.class || 'unknown';
        
        // Apply filters
        if (classFilter !== 'all' && classId !== classFilter) {
            return;
        }
        
        if (subjectFilter !== 'all' && result.exam?.subject !== subjectFilter) {
            return;
        }
        
        if (!classGroups[classId]) {
            classGroups[classId] = {
                students: {},
                results: []
            };
        }
        
        // Ensure student exists in group
        if (!classGroups[classId].students[student.id]) {
            classGroups[classId].students[student.id] = {
                student: student,
                results: []
            };
        }
        
        // Add result to student
        classGroups[classId].students[student.id].results.push(result);
        classGroups[classId].results.push(result);
    });
    
    // Sort classes alphabetically
    const sortedClasses = Object.keys(classGroups).sort((a, b) => {
        const nameA = formatClassName(a);
        const nameB = formatClassName(b);
        return nameA.localeCompare(nameB);
    });
    
    if (sortedClasses.length === 0) {
        container.innerHTML = '<p class="empty-state">No students or results found matching your filters.</p>';
        return;
    }
    
    let html = '';
    
    sortedClasses.forEach(classId => {
        const className = formatClassName(classId);
        const classData = classGroups[classId];
        const students = Object.values(classData.students);
        
        // Sort students alphabetically
        students.sort((a, b) => {
            const nameA = (a.student?.name || a.student?.username || '').toLowerCase();
            const nameB = (b.student?.name || b.student?.username || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Filter out students with no results if we're filtering by subject
        const displayStudents = subjectFilter === 'all' 
            ? students 
            : students.filter(s => s.results.length > 0);
        
        if (displayStudents.length === 0) {
            return; // Skip this class if no students to display
        }
        
        html += `
            <div class="card" style="margin-bottom: 25px;">
                <h4 style="color: var(--primary-color); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-color);">
                    📚 ${className} 
                    <span style="font-size: 14px; font-weight: normal; color: #666;">
                        (${displayStudents.length} student${displayStudents.length !== 1 ? 's' : ''}${classData.results.length > 0 ? `, ${classData.results.length} result${classData.results.length !== 1 ? 's' : ''}` : ''})
                    </span>
                </h4>
                <div style="overflow-x: auto;">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Student Name / Username</th>
                                <th>Exam</th>
                                <th>Subject</th>
                                <th>Lecturer</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Grade</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        displayStudents.forEach(studentData => {
            const student = studentData.student;
            const studentResults = studentData.results;
            
            // Display both name and username if available
            const studentDisplay = student.name 
                ? `${escapeHtml(student.name)} <small style="color: #666;">(${escapeHtml(student.username || 'N/A')})</small>`
                : escapeHtml(student.username || 'Unknown');
            
            if (studentResults.length === 0) {
                // Student with no exam results yet
                html += `
                    <tr style="opacity: 0.7;">
                        <td>${studentDisplay}</td>
                        <td colspan="8" style="color: #999; font-style: italic;">No exam results yet</td>
                    </tr>
                `;
            } else {
                // Student with exam results
                studentResults.forEach(result => {
                    const exam = result.exam || {};
                    const lecturer = exam.lecturer || {};
                    const grade = result.grade || calculateGrade(result.percentage);
                    const gradeClass = `grade-${grade}`;
                    const statusBadge = exam.results_released 
                        ? '<span style="color: #28a745; font-weight: bold;">Released</span>'
                        : '<span style="color: #ffc107; font-weight: bold;">Pending</span>';
                    
                    html += `
                        <tr>
                            <td>${studentDisplay}</td>
                            <td>${escapeHtml(exam.title || 'Unknown')}</td>
                            <td>${escapeHtml(exam.subject || 'Unknown')}</td>
                            <td>${escapeHtml(lecturer.name || lecturer.username || 'Unknown')}</td>
                            <td>${result.score || 0} / ${exam.total_marks || 0}</td>
                            <td>${(result.percentage || 0).toFixed(1)}%</td>
                            <td><span class="grade-badge ${gradeClass}">${grade}</span></td>
                            <td>${statusBadge}</td>
                            <td>
                                ${!exam.results_released ? `<button onclick="releaseExamResults('${exam.id}')" class="btn btn-success" style="padding: 6px 12px; font-size: 12px;">Release</button>` : ''}
                            </td>
                        </tr>
                    `;
                });
            }
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Display results in table (legacy function - kept for compatibility)
function displayResults(results) {
    displayResultsGroupedByClass(results);
}

// Release results for a specific exam
async function releaseExamResults(examId) {
    if (!confirm('Are you sure you want to release results for this exam? Students will be able to see their scores.')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error. Please try again.', 'Error');
            return;
        }
        
        const { error } = await supabase
            .from('exams')
            .update({ results_released: true })
            .eq('id', examId);
        
        if (error) {
            console.error('Error releasing results:', error);
            showError('Failed to release results. Please try again.', 'Error');
            return;
        }
        
        showSuccess('Results released successfully! Students can now view their scores.', 'Success');
        loadResults();
        loadStatistics();
        
    } catch (error) {
        console.error('Error releasing results:', error);
        showError('Failed to release results. Please try again.', 'Error');
    }
}

// Release all final results
async function releaseAllResults() {
    if (!confirm('⚠️ WARNING: This will release ALL pending exam results to students. Are you sure you want to proceed?')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error. Please try again.', 'Error');
            return;
        }
        
        const { error } = await supabase
            .from('exams')
            .update({ results_released: true })
            .eq('results_released', false);
        
        if (error) {
            console.error('Error releasing all results:', error);
            showError('Failed to release results. Please try again.', 'Error');
            return;
        }
        
        showSuccess('All results released successfully! Students can now view their scores.', 'Success');
        loadResults();
        loadStatistics();
        
    } catch (error) {
        console.error('Error releasing all results:', error);
        showError('Failed to release results. Please try again.', 'Error');
    }
}

// Load final grades summary by class
async function loadFinalGrades() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get all grades with student and exam info
        const { data: grades, error } = await supabase
            .from('exam_grades')
            .select(`
                *,
                student:users!exam_grades_student_id_fkey(id, name, class),
                exam:exams!exam_grades_exam_id_fkey(id, subject, class_id, exam_type)
            `);
        
        if (error) {
            console.error('Error loading final grades:', error);
            return;
        }
        
        // Group by class and student
        const classGroups = {};
        
        (grades || []).forEach(grade => {
            const student = grade.student || {};
            const classId = student.class || 'unknown';
            const studentId = student.id;
            
            if (!classGroups[classId]) {
                classGroups[classId] = {};
            }
            
            if (!classGroups[classId][studentId]) {
                classGroups[classId][studentId] = {
                    student: student,
                    exams: [],
                    totalScaledScore: 0
                };
            }
            
            classGroups[classId][studentId].exams.push(grade);
            classGroups[classId][studentId].totalScaledScore += (grade.scaled_score || 0);
        });
        
        displayFinalGrades(classGroups);
        
    } catch (error) {
        console.error('Error loading final grades:', error);
    }
}

// Display final grades summary
function displayFinalGrades(classGroups) {
    const container = document.getElementById('finalGradesContainer');
    if (!container) return;
    
    if (Object.keys(classGroups).length === 0) {
        container.innerHTML = '<p class="empty-state">No final grades available yet.</p>';
        return;
    }
    
    let html = '';
    
    Object.keys(classGroups).sort().forEach(classId => {
        const className = formatClassName(classId);
        const students = Object.values(classGroups[classId]);
        
        html += `
            <div class="card" style="margin-bottom: 20px;">
                <h4 style="color: var(--primary-color); margin-bottom: 15px;">${className}</h4>
                <div style="overflow-x: auto;">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Total Exams</th>
                                <th>Final Score</th>
                                <th>Final Grade</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Sort students alphabetically by name
        const sortedStudents = [...students].sort((a, b) => {
            const nameA = (a.student?.name || a.student?.username || '').toLowerCase();
            const nameB = (b.student?.name || b.student?.username || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        sortedStudents.forEach(studentData => {
            const student = studentData.student;
            const finalScore = studentData.totalScaledScore;
            const finalGrade = calculateFinalGrade(finalScore);
            const gradeClass = `grade-${finalGrade}`;
            const allReleased = studentData.exams.every(e => e.exam?.results_released);
            
            // Display both name and username if available
            const studentDisplay = student.name 
                ? `${escapeHtml(student.name)} <small style="color: #666;">(${escapeHtml(student.username || 'N/A')})</small>`
                : escapeHtml(student.username || 'Unknown');
            
            html += `
                <tr>
                    <td>${studentDisplay}</td>
                    <td>${studentData.exams.length}</td>
                    <td>${finalScore.toFixed(1)}%</td>
                    <td><span class="grade-badge ${gradeClass}">${finalGrade}</span></td>
                    <td>${allReleased ? '<span style="color: #28a745;">Complete</span>' : '<span style="color: #ffc107;">Pending</span>'}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Calculate grade from percentage
function calculateGrade(percentage) {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

// Calculate final grade from scaled score
function calculateFinalGrade(scaledScore) {
    if (scaledScore >= 80) return 'A';
    if (scaledScore >= 70) return 'B';
    if (scaledScore >= 60) return 'C';
    if (scaledScore >= 50) return 'D';
    return 'F';
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
    return classNames[classId] || classId.toUpperCase();
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
