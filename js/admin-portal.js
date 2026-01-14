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
    loadAllUsers();
    loadAnalytics();
    loadGradeThresholds();
    
    // Populate subject dropdown based on class
    document.getElementById('filterClass').addEventListener('change', function() {
        updateSubjectDropdown(this.value);
    });
    
    // Auto-refresh analytics every 60 seconds
    setInterval(() => {
        loadAnalytics();
        loadStatistics();
    }, 60000);
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
                    exam_type,
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
    const releaseAllBtn = document.getElementById('releaseAllBtn');
    if (releaseAllBtn) {
        releaseAllBtn.style.display = hasUnreleased ? 'block' : 'none';
    }
    
    // Check if there are unreleased semester results
    const hasUnreleasedSemester = results.some(r => !r.exam?.semester_results_released);
    const releaseSemesterBtn = document.getElementById('releaseSemesterBtn');
    if (releaseSemesterBtn) {
        releaseSemesterBtn.style.display = hasUnreleasedSemester ? 'block' : 'none';
    }
    
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
        
        // Always show ALL students (even without results)
        // Subject filter only affects which exam results are shown, not which students appear
        const displayStudents = students;
        
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
                                <th>Exam Type</th>
                                <th>Subject</th>
                                <th>Lecturer</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Scaled Score</th>
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
            
            // Filter results by subject if filter is applied
            let displayResults = studentResults;
            if (subjectFilter !== 'all') {
                displayResults = studentResults.filter(r => r.exam?.subject === subjectFilter);
            }
            
            if (displayResults.length === 0 && studentResults.length === 0) {
                // Student with no exam results yet (for any subject)
                html += `
                    <tr style="opacity: 0.7;">
                        <td>${studentDisplay}</td>
                        <td colspan="10" style="color: #999; font-style: italic;">No exam results yet</td>
                    </tr>
                `;
            } else if (displayResults.length === 0 && studentResults.length > 0) {
                // Student has results but not for the selected subject
                html += `
                    <tr style="opacity: 0.7;">
                        <td>${studentDisplay}</td>
                        <td colspan="10" style="color: #999; font-style: italic;">No results for selected subject</td>
                    </tr>
                `;
            } else {
                // Student with exam results (filtered by subject if applicable)
                displayResults.forEach(result => {
                    const exam = result.exam || {};
                    const lecturer = exam.lecturer || {};
                    const grade = result.grade || calculateGrade(result.percentage);
                    const gradeClass = `grade-${grade}`;
                    const statusBadge = exam.results_released 
                        ? '<span style="color: #28a745; font-weight: bold;">Released</span>'
                        : '<span style="color: #ffc107; font-weight: bold;">Pending</span>';
                    
                    const examType = exam.exam_type || 'N/A';
                    const examTypeDisplay = formatExamType(examType);
                    const examTypePercentage = getExamTypePercentage(examType);
                    const scaledScore = result.scaled_score || (result.percentage ? (result.percentage * examTypePercentage / 100) : 0);
                    
                    html += `
                        <tr>
                            <td>${studentDisplay}</td>
                            <td>${escapeHtml(exam.title || 'Unknown')}</td>
                            <td>
                                <span style="font-weight: 600; color: var(--primary-color);">${examTypeDisplay}</span>
                                <br><small style="color: #666;">${examTypePercentage}%</small>
                            </td>
                            <td>${escapeHtml(exam.subject || 'Unknown')}</td>
                            <td>${escapeHtml(lecturer.name || lecturer.username || 'Unknown')}</td>
                            <td>${result.score || 0} / ${exam.total_marks || 0}</td>
                            <td>${(result.percentage || 0).toFixed(1)}%</td>
                            <td><strong style="color: var(--primary-color);">${scaledScore.toFixed(2)}%</strong></td>
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

// Release all final results (individual exam results - lecturers control this)
async function releaseAllResults() {
    if (!confirm('⚠️ WARNING: This will release ALL pending individual exam results to students. Lecturers can also release their own exam results. Are you sure you want to proceed?')) {
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
        
        showSuccess('All individual exam results released successfully! Students can now view their scores.', 'Success');
        loadResults();
        loadStatistics();
        
    } catch (error) {
        console.error('Error releasing all results:', error);
        showError('Failed to release results. Please try again.', 'Error');
    }
}

// Release Final Semester Results (Admin-only control)
async function releaseFinalSemesterResults() {
    if (!confirm('⚠️ FINAL SEMESTER RESULTS RELEASE\n\nThis will release final semester grades to all students.\n\nStudents will be able to see their:\n- Final semester grade\n- Complete grade breakdown\n\nAre you sure you want to proceed?')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error. Please try again.', 'Error');
            return;
        }
        
        // Release semester results for all exams
        const { error } = await supabase
            .from('exams')
            .update({ semester_results_released: true })
            .eq('semester_results_released', false);
        
        if (error) {
            console.error('Error releasing final semester results:', error);
            showError('Failed to release final semester results. Please try again.', 'Error');
            return;
        }
        
        showSuccess('✅ Final semester results released successfully!\n\nStudents can now view their final semester grades.', 'Success');
        loadResults();
        loadFinalGrades();
        loadStatistics();
        
    } catch (error) {
        console.error('Error releasing final semester results:', error);
        showError('Failed to release final semester results. Please try again.', 'Error');
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
        
        // Get all grades with student and exam info (including lecturer)
        const { data: grades, error } = await supabase
            .from('exam_grades')
            .select(`
                *,
                student:users!exam_grades_student_id_fkey(id, name, class),
                exam:exams!exam_grades_exam_id_fkey(
                    id, 
                    subject, 
                    class_id, 
                    exam_type,
                    lecturer_id,
                    lecturer:users!exams_lecturer_id_fkey(id, name, username)
                )
            `);
        
        if (error) {
            console.error('Error loading final grades:', error);
            return;
        }
        
        // Group by class and student, calculate final grades automatically
        const classGroups = {};
        
        (grades || []).forEach(grade => {
            const student = grade.student || {};
            const exam = grade.exam || {};
            const classId = student.class || 'unknown';
            const studentId = student.id;
            
            if (!classGroups[classId]) {
                classGroups[classId] = {};
            }
            
            if (!classGroups[classId][studentId]) {
                classGroups[classId][studentId] = {
                    student: student,
                    exams: [],
                    totalScaledScore: 0,
                    examBreakdown: {} // Track exams by type and lecturer
                };
            }
            
            // Calculate scaled score if not already calculated
            const examType = exam.exam_type || 'N/A';
            const examTypePercentage = getExamTypePercentage(examType);
            
            // For final exams with written scores, use the combined score
            // If written_score exists, total score = objective_score + written_score
            let finalPercentage = grade.percentage;
            if (grade.written_score !== null && grade.written_score !== undefined && 
                grade.objective_score !== null && grade.objective_score !== undefined) {
                // Recalculate percentage from combined scores
                const totalScore = (grade.objective_score || 0) + (grade.written_score || 0);
                finalPercentage = (totalScore / exam.total_marks) * 100;
            }
            
            const scaledScore = grade.scaled_score || (finalPercentage ? (finalPercentage * examTypePercentage / 100) : 0);
            
            // Update scaled_score in grade object for display
            if (!grade.scaled_score && finalPercentage) {
                grade.scaled_score = scaledScore;
            }
            
            classGroups[classId][studentId].exams.push(grade);
            classGroups[classId][studentId].totalScaledScore += scaledScore;
            
            // Track exam breakdown by lecturer
            const lecturerId = exam.lecturer_id || 'unknown';
            const lecturerName = exam.lecturer?.name || exam.lecturer?.username || 'Unknown';
            if (!classGroups[classId][studentId].examBreakdown[lecturerId]) {
                classGroups[classId][studentId].examBreakdown[lecturerId] = {
                    lecturerName: lecturerName,
                    exams: []
                };
            }
            classGroups[classId][studentId].examBreakdown[lecturerId].exams.push({
                examType: examType,
                examTypeDisplay: formatExamType(examType),
                percentage: examTypePercentage,
                score: grade.percentage || 0,
                scaledScore: scaledScore
            });
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
                                <th>Exam Breakdown</th>
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
            const semesterReleased = studentData.exams.some(e => e.exam?.semester_results_released);
            
            // Display both name and username if available
            const studentDisplay = student.name 
                ? `${escapeHtml(student.name)} <small style="color: #666;">(${escapeHtml(student.username || 'N/A')})</small>`
                : escapeHtml(student.username || 'Unknown');
            
            // Build exam breakdown by lecturer
            let breakdownHtml = '<div style="font-size: 12px;">';
            const lecturers = Object.keys(studentData.examBreakdown || {});
            if (lecturers.length === 0) {
                breakdownHtml += '<span style="color: #999;">No exams</span>';
            } else {
                lecturers.forEach(lecturerId => {
                    const lecturerData = studentData.examBreakdown[lecturerId];
                    breakdownHtml += `<div style="margin-bottom: 8px;"><strong>${escapeHtml(lecturerData.lecturerName)}:</strong><br>`;
                    lecturerData.exams.forEach(exam => {
                        breakdownHtml += `<span style="color: #666;">${exam.examTypeDisplay} (${exam.percentage}%): ${exam.score.toFixed(1)}% = ${exam.scaledScore.toFixed(2)}%</span><br>`;
                    });
                    breakdownHtml += '</div>';
                });
            }
            breakdownHtml += '</div>';
            
            html += `
                <tr>
                    <td>${studentDisplay}</td>
                    <td>${studentData.exams.length}</td>
                    <td><strong style="color: var(--primary-color); font-size: 16px;">${finalScore.toFixed(2)}%</strong></td>
                    <td><span class="grade-badge ${gradeClass}">${finalGrade}</span></td>
                    <td style="max-width: 300px;">${breakdownHtml}</td>
                    <td>
                        ${allReleased ? '<span style="color: #28a745;">✓ Individual Results Released</span><br>' : '<span style="color: #ffc107;">Individual Results Pending</span><br>'}
                        ${semesterReleased ? '<span style="color: #28a745; font-weight: bold;">✓ Final Semester Released</span>' : '<span style="color: #dc3545;">Final Semester Pending</span>'}
                    </td>
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

// Get grade thresholds (from settings or default)
function getGradeThresholds() {
    const saved = localStorage.getItem('gradeThresholds');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing grade thresholds:', e);
        }
    }
    return { A: 80, B: 70, C: 60, D: 50 };
}

// Calculate grade from percentage
function calculateGrade(percentage) {
    const thresholds = getGradeThresholds();
    if (percentage >= thresholds.A) return 'A';
    if (percentage >= thresholds.B) return 'B';
    if (percentage >= thresholds.C) return 'C';
    if (percentage >= thresholds.D) return 'D';
    return 'F';
}

// Calculate final grade from scaled score
function calculateFinalGrade(scaledScore) {
    const thresholds = getGradeThresholds();
    if (scaledScore >= thresholds.A) return 'A';
    if (scaledScore >= thresholds.B) return 'B';
    if (scaledScore >= thresholds.C) return 'C';
    if (scaledScore >= thresholds.D) return 'D';
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

// Get exam type percentage weight (matches lecturer-exam.js)
function getExamTypePercentage(examType) {
    if (!examType) return 0;
    const percentages = {
        'opening_exam': 5,
        'quiz': 5,
        'bft': 2.5, // Each BFT is 2.5%, 2 BFTs = 5% total
        'bft_1': 2.5, // BFT 1 is 2.5%
        'bft_2': 2.5, // BFT 2 is 2.5%
        'mid_course_exercise': 15,
        'mid_cs_exam': 20,
        'gen_assessment': 5,
        'final_cse_exercise': 20,
        'final_exam': 25
    };
    return percentages[examType] || 0;
}

// Format exam type for display (matches lecturer-exam.js)
function formatExamType(examType) {
    if (!examType || examType === 'N/A') return 'N/A';
    const types = {
        'opening_exam': 'Opening Exam',
        'quiz': 'Quiz',
        'bft': 'BFT (Field Exercise - 2x Compulsory)',
        'bft_1': 'BFT 1 (2.5%)',
        'bft_2': 'BFT 2 (2.5%)',
        'mid_course_exercise': 'Mid Course Exercise',
        'mid_cs_exam': 'Mid CS Exam',
        'gen_assessment': 'Gen Assessment',
        'final_cse_exercise': 'Final CSE Exercise',
        'final_exam': 'Final Exam'
    };
    return types[examType] || examType;
}

// Load students for BFT score entry
async function loadBFTStudents() {
    const classId = document.getElementById('bftClass').value;
    const bftNumber = document.getElementById('bftNumber').value;
    const container = document.getElementById('bftEntryContainer');
    
    if (!classId) {
        container.innerHTML = '<p class="empty-state">Select a class to enter BFT scores</p>';
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            container.innerHTML = '<p class="empty-state" style="color: red;">Database connection error</p>';
            return;
        }
        
        // Get all students in the selected class
        const { data: students, error } = await supabase
            .from('users')
            .select('id, name, username, class')
            .eq('role', 'student')
            .eq('class', classId)
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error loading students:', error);
            container.innerHTML = '<p class="empty-state" style="color: red;">Error loading students</p>';
            return;
        }
        
        if (!students || students.length === 0) {
            container.innerHTML = '<p class="empty-state">No students found in this class</p>';
            return;
        }
        
        // Get existing BFT scores for this BFT number
        const examType = `bft_${bftNumber}`;
        const { data: existingGrades } = await supabase
            .from('exam_grades')
            .select('student_id, score, percentage')
            .eq('exam_id', await getOrCreateBFTExam(classId, examType));
        
        const existingScores = {};
        if (existingGrades) {
            existingGrades.forEach(grade => {
                existingScores[grade.student_id] = grade;
            });
        }
        
        let html = `
            <div style="overflow-x: auto;">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>BFT ${bftNumber} Score (0-100)</th>
                            <th>Percentage</th>
                            <th>Scaled Score (2.5%)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        students.forEach(student => {
            const existing = existingScores[student.id];
            const studentDisplay = student.name 
                ? `${escapeHtml(student.name)} <small style="color: #666;">(${escapeHtml(student.username || 'N/A')})</small>`
                : escapeHtml(student.username || 'Unknown');
            
            html += `
                <tr>
                    <td>${studentDisplay}</td>
                    <td>
                        <input type="number" 
                               id="bft_score_${student.id}" 
                               class="form-control" 
                               min="0" 
                               max="100" 
                               step="0.1"
                               value="${existing ? existing.score : ''}"
                               placeholder="Enter score (0-100)"
                               style="width: 120px;">
                    </td>
                    <td id="bft_percentage_${student.id}">
                        ${existing ? existing.percentage.toFixed(1) + '%' : '-'}
                    </td>
                    <td id="bft_scaled_${student.id}">
                        ${existing ? (existing.percentage * 2.5 / 100).toFixed(2) + '%' : '-'}
                    </td>
                    <td>
                        <button onclick="saveBFTScore('${student.id}', '${student.name || student.username}', ${bftNumber})" 
                                class="btn btn-primary" 
                                style="padding: 6px 12px; font-size: 12px;">
                            Save
                        </button>
                    </td>
                </tr>
            `;
            
            // Add event listener for real-time calculation
            setTimeout(() => {
                const scoreInput = document.getElementById(`bft_score_${student.id}`);
                if (scoreInput) {
                    scoreInput.addEventListener('input', function() {
                        const score = parseFloat(this.value) || 0;
                        const percentage = score; // BFT score is already a percentage (0-100)
                        const scaled = percentage * 2.5 / 100;
                        
                        document.getElementById(`bft_percentage_${student.id}`).textContent = 
                            score > 0 ? percentage.toFixed(1) + '%' : '-';
                        document.getElementById(`bft_scaled_${student.id}`).textContent = 
                            score > 0 ? scaled.toFixed(2) + '%' : '-';
                    });
                }
            }, 100);
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="saveAllBFTScores(${bftNumber})" class="btn btn-success">
                    Save All Scores
                </button>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading BFT students:', error);
        container.innerHTML = '<p class="empty-state" style="color: red;">Error loading students</p>';
    }
}

// Get or create BFT exam record
async function getOrCreateBFTExam(classId, examType) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    // Get current admin user for lecturer_id
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
    
    if (!currentUser || !currentUser.id) {
        console.error('Error: Admin user not found when creating BFT exam');
        return null;
    }
    
    // Check if BFT exam exists
    const { data: existingExam } = await supabase
        .from('exams')
        .select('id')
        .eq('exam_type', examType)
        .eq('class_id', classId)
        .maybeSingle();
    
    if (existingExam) {
        return existingExam.id;
    }
    
    // Create BFT exam if it doesn't exist
    // Use admin's ID as lecturer_id (required by database constraint)
    const { data: newExam, error } = await supabase
        .from('exams')
        .insert({
            lecturer_id: currentUser.id, // Required field - use admin's ID
            title: `BFT ${examType.split('_')[1]} - ${formatClassName(classId)}`,
            exam_type: examType,
            subject: 'BFT (Battle Fitness Test)',
            class_id: classId,
            total_marks: 100,
            duration_minutes: 0, // Field exercise, no time limit
            is_active: true,
            results_released: false
        })
        .select('id')
        .single();
    
    if (error) {
        console.error('Error creating BFT exam:', error);
        return null;
    }
    
    return newExam.id;
}

// Save individual BFT score
async function saveBFTScore(studentId, studentName, bftNumber) {
    const classId = document.getElementById('bftClass').value;
    const scoreInput = document.getElementById(`bft_score_${studentId}`);
    const score = parseFloat(scoreInput.value);
    
    if (!score || score < 0 || score > 100) {
        showError('Please enter a valid score between 0 and 100', 'Invalid Score');
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        const examType = `bft_${bftNumber}`;
        const examId = await getOrCreateBFTExam(classId, examType);
        
        if (!examId) {
            showError('Error creating BFT exam record', 'Error');
            return;
        }
        
        const percentage = score; // BFT score is already a percentage
        const scaledScore = percentage * 2.5 / 100; // 2.5% per BFT
        const grade = calculateGrade(percentage);
        
        // Check if grade already exists
        const { data: existingGrade } = await supabase
            .from('exam_grades')
            .select('id')
            .eq('student_id', studentId)
            .eq('exam_id', examId)
            .maybeSingle();
        
        if (existingGrade) {
            // Update existing grade
            const { error } = await supabase
                .from('exam_grades')
                .update({
                    score: score,
                    percentage: percentage,
                    grade: grade,
                    scaling_percentage: 2.5,
                    scaled_score: scaledScore
                })
                .eq('id', existingGrade.id);
            
            if (error) throw error;
            showSuccess(`BFT ${bftNumber} score updated for ${studentName}`, 'Success');
        } else {
            // Create new grade (need to create a dummy attempt first)
            const { data: attempt } = await supabase
                .from('student_exam_attempts')
                .insert({
                    student_id: studentId,
                    exam_id: examId,
                    status: 'submitted',
                    started_at: new Date().toISOString(),
                    submitted_at: new Date().toISOString()
                })
                .select('id')
                .single();
            
            if (!attempt) {
                throw new Error('Failed to create attempt');
            }
            
            const { error } = await supabase
                .from('exam_grades')
                .insert({
                    student_id: studentId,
                    exam_id: examId,
                    attempt_id: attempt.id,
                    score: score,
                    percentage: percentage,
                    grade: grade,
                    scaling_percentage: 2.5,
                    scaled_score: scaledScore
                });
            
            if (error) throw error;
            showSuccess(`BFT ${bftNumber} score saved for ${studentName}`, 'Success');
        }
        
        // Refresh displays
        loadBFTStudents();
        loadFinalGrades();
        loadResults();
        
    } catch (error) {
        console.error('Error saving BFT score:', error);
        showError('Failed to save BFT score. Please try again.', 'Error');
    }
}

// Save all BFT scores at once
async function saveAllBFTScores(bftNumber) {
    const classId = document.getElementById('bftClass').value;
    if (!classId) {
        showError('Please select a class first', 'Error');
        return;
    }
    
    if (!confirm(`Are you sure you want to save all BFT ${bftNumber} scores for this class?`)) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        // Get all students in class
        const { data: students } = await supabase
            .from('users')
            .select('id, name, username')
            .eq('role', 'student')
            .eq('class', classId);
        
        if (!students || students.length === 0) {
            showError('No students found in this class', 'Error');
            return;
        }
        
        const examType = `bft_${bftNumber}`;
        const examId = await getOrCreateBFTExam(classId, examType);
        
        if (!examId) {
            showError('Error creating BFT exam record', 'Error');
            return;
        }
        
        let saved = 0;
        let errors = 0;
        
        for (const student of students) {
            const scoreInput = document.getElementById(`bft_score_${student.id}`);
            if (!scoreInput || !scoreInput.value) continue;
            
            const score = parseFloat(scoreInput.value);
            if (score < 0 || score > 100) continue;
            
            try {
                await saveBFTScore(student.id, student.name || student.username, bftNumber);
                saved++;
            } catch (err) {
                errors++;
                console.error(`Error saving score for ${student.name}:`, err);
            }
        }
        
        if (saved > 0) {
            showSuccess(`Saved ${saved} BFT ${bftNumber} score(s)${errors > 0 ? `. ${errors} error(s) occurred.` : ''}`, 'Success');
        } else {
            showError('No valid scores to save', 'Error');
        }
        
    } catch (error) {
        console.error('Error saving all BFT scores:', error);
        showError('Failed to save scores. Please try again.', 'Error');
    }
}

// ==================== USER MANAGEMENT ====================

// Load all users with filters
async function loadAllUsers() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        const roleFilter = document.getElementById('userRoleFilter').value;
        const classFilter = document.getElementById('userClassFilter').value;
        const searchFilter = document.getElementById('userSearchFilter').value.toLowerCase().trim();
        
        let query = supabase
            .from('users')
            .select('id, username, name, email, role, class, created_at')
            .order('created_at', { ascending: false });
        
        if (roleFilter !== 'all') {
            query = query.eq('role', roleFilter);
        }
        
        if (classFilter !== 'all') {
            query = query.eq('class', classFilter);
        }
        
        const { data: users, error } = await query;
        
        if (error) {
            console.error('Error loading users:', error);
            showError('Failed to load users. Please try again.', 'Error');
            return;
        }
        
        // Apply search filter client-side
        let filteredUsers = users || [];
        if (searchFilter) {
            filteredUsers = filteredUsers.filter(user => {
                const name = (user.name || '').toLowerCase();
                const username = (user.username || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                return name.includes(searchFilter) || 
                       username.includes(searchFilter) || 
                       email.includes(searchFilter);
            });
        }
        
        displayUsers(filteredUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Please try again.', 'Error');
    }
}

// Display users in table, grouped by role
function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<p class="empty-state">No users found matching your filters.</p>';
        return;
    }
    
    // Group users by role
    const usersByRole = {
        'student': [],
        'lecturer': [],
        'admin': []
    };
    
    users.forEach(user => {
        const role = user.role || 'student';
        if (usersByRole.hasOwnProperty(role)) {
            usersByRole[role].push(user);
        } else {
            usersByRole['student'].push(user); // Default to student if unknown role
        }
    });
    
    // Role display configuration
    const roleConfig = {
        'student': {
            title: '👨‍🎓 Students',
            color: '#28a745',
            badge: '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Student</span>'
        },
        'lecturer': {
            title: '👨‍🏫 Lecturers',
            color: '#17a2b8',
            badge: '<span style="background: #17a2b8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Lecturer</span>'
        },
        'admin': {
            title: '👑 Administrators',
            color: '#dc3545',
            badge: '<span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Admin</span>'
        }
    };
    
    let html = '';
    
    // Display each role group
    ['student', 'lecturer', 'admin'].forEach(role => {
        const roleUsers = usersByRole[role];
        if (roleUsers.length === 0) return; // Skip empty groups
        
        const config = roleConfig[role];
        
        html += `
            <div class="card" style="margin-bottom: 25px;">
                <h4 style="color: ${config.color}; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid ${config.color};">
                    ${config.title}
                    <span style="font-size: 14px; font-weight: normal; color: #666;">
                        (${roleUsers.length} ${roleUsers.length === 1 ? 'user' : 'users'})
                    </span>
                </h4>
                <div style="overflow-x: auto;">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Class</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Sort users alphabetically by name
        roleUsers.sort((a, b) => {
            const nameA = (a.name || a.username || '').toLowerCase();
            const nameB = (b.name || b.username || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        roleUsers.forEach(user => {
            const className = user.class ? formatClassName(user.class) : '-';
            const registeredDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
            const nameDisplay = user.name || user.username || 'Unknown';
            
            html += `
                <tr>
                    <td>${escapeHtml(nameDisplay)}</td>
                    <td>${escapeHtml(user.username || 'N/A')}</td>
                    <td>${escapeHtml(user.email || 'N/A')}</td>
                    <td>${config.badge}</td>
                    <td>${className}</td>
                    <td>${registeredDate}</td>
                    <td>
                        <button onclick="editUser('${user.id}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;">Edit</button>
                        <button onclick="resetUserPassword('${user.id}', '${escapeHtml(nameDisplay)}')" class="btn btn-warning" style="padding: 6px 12px; font-size: 12px;">Reset Password</button>
                    </td>
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

// Edit user information
async function editUser(userId) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error || !user) {
            showError('User not found', 'Error');
            return;
        }
        
        const newName = prompt('Enter new name:', user.name || '');
        if (newName === null) return;
        
        const newEmail = prompt('Enter new email:', user.email || '');
        if (newEmail === null) return;
        
        const { error: updateError } = await supabase
            .from('users')
            .update({
                name: newName.trim() || null,
                email: newEmail.trim() || null
            })
            .eq('id', userId);
        
        if (updateError) {
            console.error('Error updating user:', updateError);
            showError('Failed to update user. Please try again.', 'Error');
            return;
        }
        
        showSuccess('User information updated successfully!', 'Success');
        loadAllUsers();
        
    } catch (error) {
        console.error('Error editing user:', error);
        showError('Failed to update user. Please try again.', 'Error');
    }
}

// Reset user password
async function resetUserPassword(userId, userName) {
    if (!confirm(`Are you sure you want to reset the password for ${userName}?\n\n⚠️ Note: Password reset requires Supabase Admin API access.\n\nFor now, please use the Supabase Dashboard to reset passwords.\n\nWould you like to see instructions?`)) {
        return;
    }
    
    // Show instructions for password reset
    const instructions = `
Password Reset Instructions:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Find the user: ${userName}
4. Click on the user to edit
5. Click "Reset Password" or "Send Password Reset Email"

Alternatively, you can use the Supabase Admin API in your backend:
- supabase.auth.admin.updateUserById(userId, { password: newPassword })

For security reasons, password reset from the admin portal requires backend API access.
    `;
    
    showError(instructions, 'Password Reset Instructions');
}

// Generate temporary password
function generateTempPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Export users to CSV
function exportUsersToCSV() {
    // This will use the current filtered users (now grouped by role)
    const container = document.getElementById('usersContainer');
    const tables = container?.querySelectorAll('table');
    if (!tables || tables.length === 0) {
        showError('No users to export. Please load users first.', 'Error');
        return;
    }
    
    let csv = 'Name,Username,Email,Role,Class,Registered\n';
    
    // Iterate through all tables (one for each role group)
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                const name = cells[0].textContent.trim().replace(/,/g, ';');
                const username = cells[1].textContent.trim().replace(/,/g, ';');
                const email = cells[2].textContent.trim().replace(/,/g, ';');
                const role = cells[3].textContent.trim().replace(/,/g, ';');
                const className = cells[4].textContent.trim().replace(/,/g, ';');
                const registered = cells[5].textContent.trim().replace(/,/g, ';');
                csv += `${name},${username},${email},${role},${className},${registered}\n`;
            }
        });
    });
    
    downloadCSV(csv, 'users_export.csv');
}

// ==================== ANALYTICS & REPORTS ====================

// Load analytics data
async function loadAnalytics() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get all grades
        const { data: grades, error } = await supabase
            .from('exam_grades')
            .select('percentage, grade');
        
        if (error) {
            console.error('Error loading analytics:', error);
            return;
        }
        
        if (!grades || grades.length === 0) {
            document.getElementById('passRate').textContent = '0%';
            document.getElementById('failRate').textContent = '0%';
            document.getElementById('averageScore').textContent = '0%';
            return;
        }
        
        // Calculate statistics
        const totalGrades = grades.length;
        const passed = grades.filter(g => g.grade && g.grade !== 'F').length;
        const failed = grades.filter(g => g.grade === 'F').length;
        const totalPercentage = grades.reduce((sum, g) => sum + (g.percentage || 0), 0);
        const averagePercentage = totalPercentage / totalGrades;
        
        const passRate = (passed / totalGrades) * 100;
        const failRate = (failed / totalGrades) * 100;
        
        document.getElementById('passRate').textContent = passRate.toFixed(1) + '%';
        document.getElementById('failRate').textContent = failRate.toFixed(1) + '%';
        document.getElementById('averageScore').textContent = averagePercentage.toFixed(1) + '%';
        
        // Get total classes
        const { data: classes } = await supabase
            .from('users')
            .select('class')
            .eq('role', 'student')
            .not('class', 'is', null);
        
        const uniqueClasses = new Set((classes || []).map(c => c.class).filter(Boolean));
        document.getElementById('totalClasses').textContent = uniqueClasses.size;
        
        // Display grade distribution
        displayGradeDistribution(grades);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display grade distribution
function displayGradeDistribution(grades) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;
    
    const distribution = {
        'A': 0,
        'B': 0,
        'C': 0,
        'D': 0,
        'F': 0
    };
    
    grades.forEach(grade => {
        const g = grade.grade;
        if (distribution.hasOwnProperty(g)) {
            distribution[g]++;
        }
    });
    
    const total = grades.length;
    const maxCount = Math.max(...Object.values(distribution));
    
    let html = `
        <h4 style="margin-bottom: 15px; color: var(--primary-color);">Grade Distribution</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
    `;
    
    Object.keys(distribution).forEach(grade => {
        const count = distribution[grade];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const gradeClass = `grade-${grade}`;
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span class="grade-badge ${gradeClass}" style="font-size: 18px;">Grade ${grade}</span>
                    <strong>${count} (${percentage.toFixed(1)}%)</strong>
                </div>
                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="background: var(--primary-color); height: 100%; width: ${barWidth}%; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ==================== EXPORT FEATURES ====================

// Export results to CSV
async function exportResults() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        const exportClass = document.getElementById('exportClass').value;
        const exportType = document.getElementById('exportType').value;
        
        let csv = '';
        
        if (exportType === 'final_grades') {
            // Export final grades
            csv = await exportFinalGrades(exportClass);
        } else if (exportType === 'all_results') {
            // Export all exam results
            csv = await exportAllResults(exportClass);
        } else if (exportType === 'by_subject') {
            // Export by subject
            csv = await exportBySubject(exportClass);
        }
        
        if (csv) {
            const filename = `results_export_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(csv, filename);
            showSuccess('Results exported successfully!', 'Success');
        } else {
            showError('No data to export', 'Error');
        }
        
    } catch (error) {
        console.error('Error exporting results:', error);
        showError('Failed to export results. Please try again.', 'Error');
    }
}

// Export final grades
async function exportFinalGrades(classFilter) {
    const supabase = getSupabaseClient();
    
    let query = supabase
        .from('exam_grades')
        .select(`
            *,
            student:users!exam_grades_student_id_fkey(id, name, username, class),
            exam:exams!exam_grades_exam_id_fkey(id, subject, class_id, exam_type)
        `);
    
    if (classFilter !== 'all') {
        const { data: students } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('class', classFilter);
        
        const studentIds = students?.map(s => s.id) || [];
        if (studentIds.length > 0) {
            query = query.in('student_id', studentIds);
        }
    }
    
    const { data: grades } = await query;
    
    if (!grades || grades.length === 0) return null;
    
    // Group by student and calculate final grades
    const studentGrades = {};
    grades.forEach(grade => {
        const studentId = grade.student?.id;
        if (!studentId) return;
        
        if (!studentGrades[studentId]) {
            studentGrades[studentId] = {
                student: grade.student,
                totalScaled: 0,
                exams: []
            };
        }
        
        const examType = grade.exam?.exam_type || 'N/A';
        const examTypePercentage = getExamTypePercentage(examType);
        const scaledScore = grade.scaled_score || (grade.percentage ? (grade.percentage * examTypePercentage / 100) : 0);
        
        studentGrades[studentId].totalScaled += scaledScore;
        studentGrades[studentId].exams.push(grade);
    });
    
    let csv = 'Student Name,Username,Class,Final Score,Final Grade,Total Exams\n';
    
    Object.values(studentGrades).forEach(data => {
        const student = data.student || {};
        const finalGrade = calculateFinalGrade(data.totalScaled);
        csv += `${student.name || student.username || 'Unknown'},${student.username || 'N/A'},${formatClassName(student.class || 'unknown')},${data.totalScaled.toFixed(2)}%,${finalGrade},${data.exams.length}\n`;
    });
    
    return csv;
}

// Export all results
async function exportAllResults(classFilter) {
    const supabase = getSupabaseClient();
    
    let query = supabase
        .from('exam_grades')
        .select(`
            *,
            student:users!exam_grades_student_id_fkey(id, name, username, class),
            exam:exams!exam_grades_exam_id_fkey(id, title, subject, class_id, exam_type, total_marks)
        `);
    
    if (classFilter !== 'all') {
        const { data: students } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('class', classFilter);
        
        const studentIds = students?.map(s => s.id) || [];
        if (studentIds.length > 0) {
            query = query.in('student_id', studentIds);
        }
    }
    
    const { data: grades } = await query;
    
    if (!grades || grades.length === 0) return null;
    
    let csv = 'Student Name,Username,Class,Exam Title,Subject,Exam Type,Score,Percentage,Grade\n';
    
    grades.forEach(grade => {
        const student = grade.student || {};
        const exam = grade.exam || {};
        csv += `${student.name || student.username || 'Unknown'},${student.username || 'N/A'},${formatClassName(student.class || 'unknown')},${exam.title || 'N/A'},${exam.subject || 'N/A'},${formatExamType(exam.exam_type || 'N/A')},${grade.score || 0}/${exam.total_marks || 0},${(grade.percentage || 0).toFixed(1)}%,${grade.grade || 'N/A'}\n`;
    });
    
    return csv;
}

// Export by subject
async function exportBySubject(classFilter) {
    // Similar to all results but grouped by subject
    return await exportAllResults(classFilter);
}

// Download CSV file
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== SYSTEM SETTINGS ====================

// Save grade thresholds
async function saveGradeThresholds() {
    const gradeA = parseInt(document.getElementById('gradeA').value);
    const gradeB = parseInt(document.getElementById('gradeB').value);
    const gradeC = parseInt(document.getElementById('gradeC').value);
    const gradeD = parseInt(document.getElementById('gradeD').value);
    
    // Validate thresholds
    if (gradeA < gradeB || gradeB < gradeC || gradeC < gradeD || gradeD < 0) {
        showError('Invalid grade thresholds. Grade A must be highest, followed by B, C, and D.', 'Error');
        return;
    }
    
    // Store in localStorage (in production, store in database)
    localStorage.setItem('gradeThresholds', JSON.stringify({
        A: gradeA,
        B: gradeB,
        C: gradeC,
        D: gradeD
    }));
    
    showSuccess('Grade thresholds saved successfully!', 'Success');
}

// Reset grade thresholds
function resetGradeThresholds() {
    if (!confirm('Reset grade thresholds to default values?')) {
        return;
    }
    
    document.getElementById('gradeA').value = 80;
    document.getElementById('gradeB').value = 70;
    document.getElementById('gradeC').value = 60;
    document.getElementById('gradeD').value = 50;
    
    localStorage.removeItem('gradeThresholds');
    showSuccess('Grade thresholds reset to default values.', 'Success');
}

// Load grade thresholds
function loadGradeThresholds() {
    const saved = localStorage.getItem('gradeThresholds');
    if (saved) {
        try {
            const thresholds = JSON.parse(saved);
            document.getElementById('gradeA').value = thresholds.A || 80;
            document.getElementById('gradeB').value = thresholds.B || 70;
            document.getElementById('gradeC').value = thresholds.C || 60;
            document.getElementById('gradeD').value = thresholds.D || 50;
        } catch (e) {
            console.error('Error loading grade thresholds:', e);
        }
    }
}
