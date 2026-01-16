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
    loadDatabaseStats();
    
    // Populate subject dropdown based on class
    document.getElementById('filterClass').addEventListener('change', function() {
        updateSubjectDropdown(this.value);
    });
    
    // Auto-refresh data every 30 seconds
    setInterval(() => {
        loadResults();
        loadFinalGrades();
        loadStatistics();
        loadDatabaseStats(); // Also refresh database stats
    }, 30000); // 30 seconds
    
    // Auto-refresh analytics every 60 seconds
    setInterval(() => {
        loadAnalytics();
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
            .select('id, username, name, class, email, courses, created_at')
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
                student:users!exam_grades_student_id_fkey(id, name, username, class, student_index),
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
    
    // Check if there are unreleased mid results (BFT1, Mid Exams, Mid Exercise)
    const hasUnreleasedMid = results.some(r => {
        const examType = r.exam?.exam_type;
        return !r.exam?.results_released && 
               (examType === 'bft_1' || examType === 'mid_cs_exam' || examType === 'mid_course_exercise');
    });
    const releaseMidBtn = document.getElementById('releaseMidBtn');
    if (releaseMidBtn) {
        releaseMidBtn.style.display = hasUnreleasedMid ? 'block' : 'none';
    }
    
    // Check if there are unreleased final results (Opening, BFT2, Final Exams, Final Exercise, Quizzes)
    const hasUnreleasedFinal = results.some(r => {
        const examType = r.exam?.exam_type;
        return !r.exam?.results_released && 
               (examType === 'opening_exam' || examType === 'bft_2' || examType === 'final_exam' || 
                examType === 'final_cse_exercise' || examType === 'quiz' || examType === 'gen_assessment');
    });
    const releaseFinalBtn = document.getElementById('releaseFinalBtn');
    if (releaseFinalBtn) {
        releaseFinalBtn.style.display = hasUnreleasedFinal ? 'block' : 'none';
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
                <div class="table-wrapper">
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
            
            // Show registered subjects for this student
            const registeredSubjects = student.courses || [];
            const subjectsDisplay = registeredSubjects.length > 0 
                ? `<div style="font-size: 11px; color: #17a2b8; margin-top: 4px;"><strong>Registered:</strong> ${registeredSubjects.map(s => escapeHtml(s)).join(', ')}</div>`
                : `<div style="font-size: 11px; color: #999; margin-top: 4px; font-style: italic;">No subjects registered</div>`;
            
            // Filter results by subject if filter is applied
            let displayResults = studentResults;
            if (subjectFilter !== 'all') {
                displayResults = studentResults.filter(r => r.exam?.subject === subjectFilter);
            }
            
            if (displayResults.length === 0 && studentResults.length === 0) {
                // Student with no exam results yet (for any subject)
                html += `
                    <tr style="opacity: 0.7;">
                        <td>${studentDisplay}${subjectsDisplay}</td>
                        <td colspan="10" style="color: #999; font-style: italic;">No exam results yet</td>
                    </tr>
                `;
            } else if (displayResults.length === 0 && studentResults.length > 0) {
                // Student has results but not for the selected subject
                html += `
                    <tr style="opacity: 0.7;">
                        <td>${studentDisplay}${subjectsDisplay}</td>
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
                            <td>${studentDisplay}${subjectsDisplay}</td>
                            <td class="exam-cell">${escapeHtml(exam.title || 'Unknown')}</td>
                            <td>
                                <span style="font-weight: 600; color: var(--primary-color);">${examTypeDisplay}</span>
                                <br><small style="color: #666;">${examTypePercentage}%</small>
                            </td>
                            <td class="subject-cell">${escapeHtml(exam.subject || 'Unknown')}</td>
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
        // Force refresh results display
        setTimeout(() => {
            loadResults();
            loadStatistics();
        }, 500);
        
    } catch (error) {
        console.error('Error releasing results:', error);
        showError('Failed to release results. Please try again.', 'Error');
    }
}

// Release Mid Results (BFT1, Mid Exams, Mid Exercise)
async function releaseMidResults() {
    if (!confirm('⚠️ RELEASE MID RESULTS\n\nThis will release results for:\n- BFT 1\n- Mid CS Exams\n- Mid Course Exercise\n\nStudents will be able to view their scores for these exams.\n\nAre you sure you want to proceed?')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error. Please try again.', 'Error');
            return;
        }
        
        // Release mid exam types: bft_1, mid_cs_exam, mid_course_exercise
        const { error } = await supabase
            .from('exams')
            .update({ results_released: true })
            .in('exam_type', ['bft_1', 'mid_cs_exam', 'mid_course_exercise'])
            .eq('results_released', false);
        
        if (error) {
            console.error('Error releasing mid results:', error);
            showError('Failed to release mid results. Please try again.', 'Error');
            return;
        }
        
        showSuccess('✅ Mid results released successfully!\n\nStudents can now view their BFT1, Mid Exams, and Mid Exercise scores.', 'Success');
        // Force refresh results display
        setTimeout(() => {
            loadResults();
            loadStatistics();
        }, 500);
        
    } catch (error) {
        console.error('Error releasing mid results:', error);
        showError('Failed to release mid results. Please try again.', 'Error');
    }
}

// Release Final Results (Opening exams, BFT2, Final exams, Final exercise, Quizzes)
async function releaseFinalResults() {
    if (!confirm('⚠️ RELEASE FINAL RESULTS\n\nThis will release results for:\n- Opening Exams\n- BFT 2\n- Final Exams\n- Final CSE Exercise\n- Quizzes\n- General Assessment\n\nStudents will be able to view their scores for these exams.\n\nAre you sure you want to proceed?')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error. Please try again.', 'Error');
            return;
        }
        
        // Release final exam types: opening_exam, bft_2, final_exam, final_cse_exercise, quiz, gen_assessment
        const { error } = await supabase
            .from('exams')
            .update({ results_released: true })
            .in('exam_type', ['opening_exam', 'bft_2', 'final_exam', 'final_cse_exercise', 'quiz', 'gen_assessment'])
            .eq('results_released', false);
        
        if (error) {
            console.error('Error releasing final results:', error);
            showError('Failed to release final results. Please try again.', 'Error');
            return;
        }
        
        showSuccess('✅ Final results released successfully!\n\nStudents can now view their Opening Exams, BFT2, Final Exams, Final Exercise, Quizzes, and General Assessment scores.', 'Success');
        // Force refresh results display
        setTimeout(() => {
            loadResults();
            loadStatistics();
        }, 500);
        
    } catch (error) {
        console.error('Error releasing final results:', error);
        showError('Failed to release final results. Please try again.', 'Error');
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
        
        // Get all grades with student and exam info (including lecturer and release status)
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
                    results_released,
                    semester_results_released,
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
                <div class="table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Total Exams</th>
                                <th>Final Score</th>
                                <th>Final Grade</th>
                                <th>Exam Breakdown</th>
                                <th>Status (Mid / Final / Semester)</th>
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
            
            // Separate exams into Mid and Final halves
            const midExamTypes = ['bft_1', 'mid_cs_exam', 'mid_course_exercise'];
            const finalExamTypes = ['opening_exam', 'bft_2', 'final_exam', 'final_cse_exercise', 'quiz', 'gen_assessment'];
            
            const midExams = studentData.exams.filter(e => {
                const examType = e.exam?.exam_type || '';
                return midExamTypes.includes(examType);
            });
            const finalExams = studentData.exams.filter(e => {
                const examType = e.exam?.exam_type || '';
                return finalExamTypes.includes(examType);
            });
            
            // Calculate Mid and Final scores separately
            let midScore = 0;
            midExams.forEach(exam => {
                const examType = exam.exam?.exam_type || '';
                const examTypePercentage = getExamTypePercentage(examType);
                const scaledScore = exam.scaled_score || (exam.percentage ? (exam.percentage * examTypePercentage / 100) : 0);
                midScore += scaledScore;
            });
            
            let finalScoreHalf = 0;
            finalExams.forEach(exam => {
                const examType = exam.exam?.exam_type || '';
                const examTypePercentage = getExamTypePercentage(examType);
                const scaledScore = exam.scaled_score || (exam.percentage ? (exam.percentage * examTypePercentage / 100) : 0);
                finalScoreHalf += scaledScore;
            });
            
            // Check release status for Mid and Final separately
            // Handle cases where exam data might be null/undefined
            const midExamsWithData = midExams.filter(e => e.exam && e.exam.id);
            const finalExamsWithData = finalExams.filter(e => e.exam && e.exam.id);
            
            // Mid status logic
            let midStatus = 'No Mid Exams';
            let midStatusColor = '#999';
            if (midExams.length > 0) {
                if (midExamsWithData.length === 0) {
                    midStatus = 'No Exam Data';
                    midStatusColor = '#999';
                } else if (midExamsWithData.every(e => e.exam.results_released === true)) {
                    midStatus = 'Released';
                    midStatusColor = '#28a745';
                } else if (midExamsWithData.some(e => e.exam.results_released === false || e.exam.results_released === null)) {
                    midStatus = 'Pending';
                    midStatusColor = '#ffc107';
                } else {
                    midStatus = 'Partial';
                    midStatusColor = '#17a2b8';
                }
            }
            
            // Final status logic
            let finalStatus = 'No Final Exams';
            let finalStatusColor = '#999';
            if (finalExams.length > 0) {
                if (finalExamsWithData.length === 0) {
                    finalStatus = 'No Exam Data';
                    finalStatusColor = '#999';
                } else if (finalExamsWithData.every(e => e.exam.results_released === true)) {
                    finalStatus = 'Released';
                    finalStatusColor = '#28a745';
                } else if (finalExamsWithData.some(e => e.exam.results_released === false || e.exam.results_released === null)) {
                    finalStatus = 'Pending';
                    finalStatusColor = '#ffc107';
                } else {
                    finalStatus = 'Partial';
                    finalStatusColor = '#17a2b8';
                }
            }
            
            // Check semester release status
            const semesterReleased = studentData.exams.some(e => e.exam && e.exam.semester_results_released === true);
            
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
                        <div style="margin-bottom: 8px;">
                            <strong>Mid Half:</strong> ${midScore.toFixed(2)}%<br>
                            <span style="color: ${midStatusColor}; font-weight: ${midStatus === 'Released' ? 'bold' : 'normal'};">
                                ${midStatus === 'Released' ? '✓ Released' : midStatus === 'Pending' ? '⏳ Pending' : midStatus}
                            </span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <strong>Final Half:</strong> ${finalScoreHalf.toFixed(2)}%<br>
                            <span style="color: ${finalStatusColor}; font-weight: ${finalStatus === 'Released' ? 'bold' : 'normal'};">
                                ${finalStatus === 'Released' ? '✓ Released' : finalStatus === 'Pending' ? '⏳ Pending' : finalStatus}
                            </span>
                        </div>
                        <div>
                            <strong>Semester:</strong><br>
                            <span style="color: ${semesterReleased ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                ${semesterReleased ? '✓ Final Semester Released' : '⏳ Final Semester Pending'}
                            </span>
                        </div>
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

// Get class prefix for student index
function getClassIndexPrefix(classId) {
    const prefixMap = {
        'signals-basic': 'SB',
        'signals-b-iii-b-ii': 'SB3B2',
        'signals-b-ii-b-i': 'SB2B1',
        'superintendent': 'SUP',
        'pre-qualifying': 'PQ',
        'regimental-basic': 'RB',
        'regimental-b-iii-b-ii': 'RB3B2',
        'regimental-b-ii-b-i': 'RB2B1',
        'rso-rsi': 'RSO',
        'electronic-warfare-course': 'EW',
        'tactical-drone-course': 'TD'
    };
    return prefixMap[classId] || 'STU'; // Default prefix if class not found
}

// Make functions globally accessible
if (typeof window !== 'undefined') {
    window.getClassIndexPrefix = getClassIndexPrefix;
}

// Generate next student index for a class
async function generateNextStudentIndex(classId) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
        
        const prefix = getClassIndexPrefix(classId);
        
        // Get all existing student indices for this class
        const { data: students, error } = await supabase
            .from('users')
            .select('student_index')
            .eq('role', 'student')
            .eq('class', classId)
            .not('student_index', 'is', null);
        
        if (error) {
            console.error('Error fetching student indices:', error);
            // Fallback: try to generate based on count
            const { data: allStudents } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'student')
                .eq('class', classId);
            
            const nextNumber = (allStudents?.length || 0) + 1;
            return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
        }
        
        // Extract numbers from existing indices
        const existingNumbers = (students || [])
            .map(s => {
                if (!s.student_index) return 0;
                const match = s.student_index.match(/\d+$/);
                return match ? parseInt(match[0]) : 0;
            })
            .filter(n => n > 0);
        
        // Find next available number
        let nextNumber = 1;
        if (existingNumbers.length > 0) {
            const maxNumber = Math.max(...existingNumbers);
            nextNumber = maxNumber + 1;
        }
        
        return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
        
    } catch (error) {
        console.error('Error generating student index:', error);
        // Fallback: return a timestamp-based index
        const prefix = getClassIndexPrefix(classId);
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${timestamp}`;
    }
}

// Make function globally accessible
if (typeof window !== 'undefined') {
    window.generateNextStudentIndex = generateNextStudentIndex;
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

// Load students for manual score entry (unified function for all types)
async function loadManualScoreStudents() {
    const classId = document.getElementById('manualScoreClass')?.value;
    const scoreType = document.getElementById('manualScoreType')?.value;
    const subject = document.getElementById('manualScoreSubject')?.value;
    const container = document.getElementById('manualScoreEntryContainer');
    
    if (!container) {
        // Fallback to old BFT container for backward compatibility
        return loadBFTStudents();
    }
    
    if (!classId || !scoreType || !subject) {
        container.innerHTML = '<p class="empty-state">Select class, score type, and subject to enter manual scores</p>';
        return;
    }
    
    // Populate subjects dropdown based on class
    await populateSubjectsForClass(classId, 'manualScoreSubject');
    
    // If subject not selected yet, wait
    if (!subject) {
        container.innerHTML = '<p class="empty-state">Please select a subject</p>';
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            container.innerHTML = '<p class="empty-state" style="color: red;">Database connection error</p>';
            return;
        }
        
        // Get all students in the class
        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id, name, username, class, student_index')
            .eq('role', 'student')
            .eq('class', classId)
            .order('username', { ascending: true });
        
        if (studentsError) throw studentsError;
        
        if (!students || students.length === 0) {
            container.innerHTML = '<p class="empty-state">No students found in this class</p>';
            return;
        }
        
        // Determine exam type and percentage
        const examType = scoreType;
        const examTypePercentage = getExamTypePercentage(examType);
        const examTypeDisplay = formatExamType(examType);
        
        // Get or create exam record for this score type and subject
        const examId = await getOrCreateManualExam(classId, examType, subject);
        
        if (!examId) {
            container.innerHTML = '<p class="empty-state" style="color: red;">Error creating exam record</p>';
            return;
        }
        
        // Get existing scores
        const { data: existingGrades } = await supabase
            .from('exam_grades')
            .select('*')
            .eq('exam_id', examId);
        
        const existingScores = {};
        (existingGrades || []).forEach(grade => {
            existingScores[grade.student_id] = grade;
        });
        
        // Build table
        let html = `
            <div class="table-wrapper">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>${examTypeDisplay} Score (0-100)</th>
                            <th>Percentage</th>
                            <th>Scaled Score (${examTypePercentage}%)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        students.forEach(student => {
            const existing = existingScores[student.id];
            html += `
                <tr>
                    <td>${escapeHtml(student.username || 'N/A')}</td>
                    <td>${escapeHtml(student.name || student.username || 'Unknown')}</td>
                    <td>
                        <input type="number" 
                               id="manual_score_${student.id}" 
                               class="form-control" 
                               min="0" 
                               max="100" 
                               step="0.1"
                               value="${existing ? existing.score : ''}" 
                               placeholder="0-100">
                    </td>
                    <td id="manual_percentage_${student.id}">
                        ${existing ? existing.percentage.toFixed(1) + '%' : '-'}
                    </td>
                    <td id="manual_scaled_${student.id}">
                        ${existing ? (existing.percentage * examTypePercentage / 100).toFixed(2) + '%' : '-'}
                    </td>
                    <td>
                        <button onclick="saveManualScore('${student.id}', '${escapeHtml(student.name || student.username)}', '${examType}', '${subject}')" 
                                class="btn btn-primary" 
                                style="padding: 6px 12px; font-size: 12px;">
                            Save
                        </button>
                    </td>
                </tr>
            `;
            
            // Add input listener for real-time calculation
            setTimeout(() => {
                const scoreInput = document.getElementById(`manual_score_${student.id}`);
                if (scoreInput) {
                    scoreInput.addEventListener('input', function() {
                        const score = parseFloat(this.value) || 0;
                        const percentage = score; // Score is already a percentage (0-100)
                        const scaled = percentage * examTypePercentage / 100;
                        
                        document.getElementById(`manual_percentage_${student.id}`).textContent = 
                            score > 0 ? percentage.toFixed(1) + '%' : '-';
                        document.getElementById(`manual_scaled_${student.id}`).textContent = 
                            score > 0 ? scaled.toFixed(2) + '%' : '-';
                    });
                }
            }, 100);
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 15px;">
                <button onclick="saveAllManualScores('${examType}', '${subject}')" class="btn btn-success">
                    Save All Scores
                </button>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading manual score students:', error);
        container.innerHTML = '<p class="empty-state" style="color: red;">Error loading students</p>';
    }
}

// Load students for BFT score entry (legacy function - kept for backward compatibility)
async function loadBFTStudents() {
    const classId = document.getElementById('bftClass')?.value;
    const bftNumber = document.getElementById('bftNumber')?.value;
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
            .select('id, name, username, class, student_index')
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
            <div class="table-wrapper">
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
            const studentIndex = student.student_index || '';
            const indexDisplay = studentIndex ? `<span style="color: var(--primary-color); font-weight: bold; margin-right: 8px;">${escapeHtml(studentIndex)}</span>` : '';
            const studentDisplay = student.name 
                ? `${indexDisplay}${escapeHtml(student.name)} <small style="color: #666;">(${escapeHtml(student.username || 'N/A')})</small>`
                : `${indexDisplay}${escapeHtml(student.username || 'Unknown')}`;
            
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

// Get or create manual exam record (for BFT, Opening Exam, Mid Exercise, Final Exercise, Quiz)
async function getOrCreateManualExam(classId, examType, subject) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    // Get admin user ID (for lecturer_id requirement)
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        console.error('Error: Admin user not found when creating manual exam');
        return null;
    }
    
    // Check if exam exists
    const { data: existingExam } = await supabase
        .from('exams')
        .select('id')
        .eq('exam_type', examType)
        .eq('class_id', classId)
        .eq('subject', subject)
        .maybeSingle();
    
    if (existingExam) {
        return existingExam.id;
    }
    
    // Create exam if it doesn't exist
    const examTypeDisplay = formatExamType(examType);
    const { data: newExam, error } = await supabase
        .from('exams')
        .insert([{
            lecturer_id: currentUser.id,
            title: `${examTypeDisplay} - ${subject} - ${formatClassName(classId)}`,
            exam_type: examType,
            subject: subject,
            class_id: classId,
            total_marks: 100,
            duration_minutes: 0, // Manual entry, no duration
            is_active: true,
            results_released: false
        }])
        .select('id')
        .single();
    
    if (error) {
        console.error('Error creating manual exam:', error);
        return null;
    }
    
    return newExam.id;
}

// Get or create BFT exam record (legacy function - kept for backward compatibility)
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

// Save individual manual score
async function saveManualScore(studentId, studentName, examType, subject) {
    const classId = document.getElementById('manualScoreClass').value;
    const scoreInput = document.getElementById(`manual_score_${studentId}`);
    const score = parseFloat(scoreInput.value);
    
    if (!scoreInput || isNaN(score) || score < 0 || score > 100) {
        showError('Please enter a valid score between 0 and 100', 'Invalid Score');
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        const examId = await getOrCreateManualExam(classId, examType, subject);
        
        if (!examId) {
            showError('Error creating exam record', 'Error');
            return;
        }
        
        const examTypePercentage = getExamTypePercentage(examType);
        const percentage = score; // Score is already a percentage (0-100)
        const scaledScore = percentage * examTypePercentage / 100;
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
            await supabase
                .from('exam_grades')
                .update({
                    score: score,
                    percentage: percentage,
                    grade: grade,
                    scaling_percentage: examTypePercentage,
                    scaled_score: scaledScore
                })
                .eq('id', existingGrade.id);
            
            showSuccess(`${formatExamType(examType)} score updated for ${studentName}`, 'Success');
        } else {
            // Create new grade (need to create a dummy attempt first for quiz manual entry)
            if (examType === 'quiz_manual') {
                // For quiz manual, we need to check if there's an automated quiz attempt
                // and add to it, or create a new one
                const { data: quizExams } = await supabase
                    .from('exams')
                    .select('id')
                    .eq('exam_type', 'quiz')
                    .eq('class_id', classId)
                    .eq('subject', subject)
                    .limit(1);
                
                let attemptId = null;
                if (quizExams && quizExams.length > 0) {
                    const quizExamId = quizExams[0].id;
                    const { data: existingAttempt } = await supabase
                        .from('student_exam_attempts')
                        .select('id')
                        .eq('student_id', studentId)
                        .eq('exam_id', quizExamId)
                        .maybeSingle();
                    
                    if (existingAttempt) {
                        attemptId = existingAttempt.id;
                    }
                }
                
                // Create grade with attempt_id if available
                await supabase
                    .from('exam_grades')
                    .insert([{
                        student_id: studentId,
                        exam_id: examId,
                        attempt_id: attemptId,
                        score: score,
                        percentage: percentage,
                        grade: grade,
                        scaling_percentage: examTypePercentage,
                        scaled_score: scaledScore
                    }]);
            } else {
                // For other types, create grade directly
                await supabase
                    .from('exam_grades')
                    .insert([{
                        student_id: studentId,
                        exam_id: examId,
                        score: score,
                        percentage: percentage,
                        grade: grade,
                        scaling_percentage: examTypePercentage,
                        scaled_score: scaledScore
                    }]);
            }
            
            showSuccess(`${formatExamType(examType)} score saved for ${studentName}`, 'Success');
        }
        
        loadManualScoreStudents();
        loadFinalGrades();
        loadResults();
        
    } catch (error) {
        console.error('Error saving manual score:', error);
        showError('Failed to save manual score. Please try again.', 'Error');
    }
}

// Save all manual scores at once
async function saveAllManualScores(examType, subject) {
    const classId = document.getElementById('manualScoreClass').value;
    if (!classId) {
        showError('Please select a class first', 'Error');
        return;
    }
    
    if (!confirm(`Are you sure you want to save all ${formatExamType(examType)} scores for ${subject} in this class?`)) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        // Get all students
        const { data: students } = await supabase
            .from('users')
            .select('id, name, username')
            .eq('role', 'student')
            .eq('class', classId);
        
        if (!students || students.length === 0) {
            showError('No students found in this class', 'Error');
            return;
        }
        
        const examId = await getOrCreateManualExam(classId, examType, subject);
        
        if (!examId) {
            showError('Error creating exam record', 'Error');
            return;
        }
        
        let saved = 0;
        let errors = 0;
        
        for (const student of students) {
            try {
                const scoreInput = document.getElementById(`manual_score_${student.id}`);
                if (!scoreInput || !scoreInput.value) continue;
                
                await saveManualScore(student.id, student.name || student.username, examType, subject);
                saved++;
            } catch (err) {
                console.error(`Error saving score for ${student.name}:`, err);
                errors++;
            }
        }
        
        if (saved > 0) {
            showSuccess(`Saved ${saved} ${formatExamType(examType)} score(s)${errors > 0 ? `. ${errors} error(s) occurred.` : ''}`, 'Success');
        } else {
            showError('No valid scores to save', 'Error');
        }
        
    } catch (error) {
        console.error('Error saving all manual scores:', error);
        showError('Failed to save scores. Please try again.', 'Error');
    }
}

// Populate subjects dropdown based on class
async function populateSubjectsForClass(classId, selectId) {
    const subjectSelect = document.getElementById(selectId);
    if (!subjectSelect) return;
    
    // Get courses for this class
    const courses = getCoursesForClass(classId);
    
    // Clear existing options except the first one
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    // Add courses as options
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        subjectSelect.appendChild(option);
    });
}

// Save all BFT scores at once (legacy function - kept for backward compatibility)
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
            showError('Database connection error. Please refresh the page.', 'Error');
            return;
        }
        
        const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';
        const classFilter = document.getElementById('userClassFilter')?.value || 'all';
        const searchFilter = (document.getElementById('userSearchFilter')?.value || '').toLowerCase().trim();
        
        // Select fields - phone_number is optional (only if column exists in database)
        // Start without phone_number to avoid errors, can be added after migration
        let selectFields = 'id, username, name, email, role, class, courses, created_at, student_index';
        
        // Try to include phone_number if the column exists (will be added after migration)
        // For now, we'll query without it to prevent errors
        let query = supabase
            .from('users')
            .select(selectFields)
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
            showError(`Failed to load users: ${error.message || 'Unknown error'}. Please try again.`, 'Error');
            return;
        }
        
        // Apply search filter client-side
        let filteredUsers = users || [];
        if (searchFilter) {
            filteredUsers = filteredUsers.filter(user => {
                const name = (user.name || '').toLowerCase();
                const username = (user.username || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const courses = (user.courses || []).join(' ').toLowerCase();
                return name.includes(searchFilter) || 
                       username.includes(searchFilter) || 
                       email.includes(searchFilter) ||
                       courses.includes(searchFilter);
            });
        }
        
        displayUsers(filteredUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showError(`Failed to load users: ${error.message || 'Unknown error'}. Please try again.`, 'Error');
    }
}

// View all registered subjects by students
async function viewAllRegisteredSubjects() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        // Get all students with their registered subjects
        const { data: students, error } = await supabase
            .from('users')
            .select('id, name, username, class, courses')
            .eq('role', 'student')
            .order('class', { ascending: true })
            .order('username', { ascending: true });
        
        if (error) {
            console.error('Error loading students:', error);
            showError('Failed to load student registrations. Please try again.', 'Error');
            return;
        }
        
        if (!students || students.length === 0) {
            showError('No students found in the system.', 'No Data');
            return;
        }
        
        // Group by subject
        const subjectGroups = {};
        const studentSubjectMap = {};
        
        students.forEach(student => {
            const registeredSubjects = student.courses || [];
            const className = formatClassName(student.class || 'unknown');
            const studentDisplay = student.name || student.username || 'Unknown';
            const studentId = student.username || student.id;
            
            registeredSubjects.forEach(subject => {
                if (!subjectGroups[subject]) {
                    subjectGroups[subject] = [];
                }
                
                subjectGroups[subject].push({
                    id: student.id,
                    name: studentDisplay,
                    username: student.username,
                    class: className,
                    classId: student.class
                });
                
                // Also create student-to-subjects map
                if (!studentSubjectMap[studentId]) {
                    studentSubjectMap[studentId] = {
                        name: studentDisplay,
                        username: student.username,
                        class: className,
                        classId: student.class,
                        student_index: student.student_index || null,
                        subjects: []
                    };
                }
                if (!studentSubjectMap[studentId].subjects.includes(subject)) {
                    studentSubjectMap[studentId].subjects.push(subject);
                }
            });
        });
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.id = 'registeredSubjectsModal';
        
        // Sort subjects alphabetically
        const sortedSubjects = Object.keys(subjectGroups).sort();
        
        // Create tabs for Subject View and Student View
        let html = `
            <div class="modal-content" style="max-width: 90%; max-height: 90vh; overflow-y: auto;">
                <span class="modal-close" onclick="closeRegisteredSubjectsModal()" style="position: absolute; right: 20px; top: 20px; font-size: 28px; cursor: pointer; z-index: 1001;">&times;</span>
                <h2 style="margin-bottom: 20px; color: var(--primary-color);">📚 All Registered Subjects</h2>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
                    <button id="subjectViewTab" onclick="switchSubjectView('subject')" class="btn btn-primary">View by Subject</button>
                    <button id="studentViewTab" onclick="switchSubjectView('student')" class="btn btn-secondary">View by Student</button>
                </div>
                
                <div id="subjectViewContent">
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="subjectSearchInput" placeholder="Search subjects..." class="form-control" onkeyup="filterSubjects()" style="max-width: 300px;">
                    </div>
                    <div id="subjectsList">
        `;
        
        // Subject View: Group by subject
        sortedSubjects.forEach(subject => {
            const studentsInSubject = subjectGroups[subject];
            html += `
                <div class="card subject-item" style="margin-bottom: 20px;" data-subject="${escapeHtml(subject)}">
                    <h4 style="color: var(--primary-color); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-color);">
                        ${escapeHtml(subject)}
                        <span style="font-size: 14px; font-weight: normal; color: #666;">(${studentsInSubject.length} student${studentsInSubject.length !== 1 ? 's' : ''})</span>
                    </h4>
                    <div class="table-wrapper">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Class</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Sort students by class, then by name
            studentsInSubject.sort((a, b) => {
                if (a.class !== b.class) {
                    return a.class.localeCompare(b.class);
                }
                return a.name.localeCompare(b.name);
            });
            
            studentsInSubject.forEach(student => {
                html += `
                    <tr>
                        <td>${escapeHtml(student.username || 'N/A')}</td>
                        <td>${escapeHtml(student.name)}</td>
                        <td>${escapeHtml(student.class)}</td>
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
        
        html += `
                    </div>
                </div>
                
                <div id="studentViewContent" style="display: none;">
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="studentSearchInput" placeholder="Search students..." class="form-control" onkeyup="filterStudents()" style="max-width: 300px;">
                    </div>
                    <div class="table-wrapper">
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Student Index</th>
                                    <th>Name</th>
                                    <th>Class</th>
                                    <th>Registered Subjects</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        // Student View: Show all students with their subjects
        const sortedStudents = Object.values(studentSubjectMap).sort((a, b) => {
            if (a.class !== b.class) {
                return a.class.localeCompare(b.class);
            }
            return a.name.localeCompare(b.name);
        });
        
        sortedStudents.forEach(student => {
            const subjectsList = student.subjects.sort().join(', ');
            const studentIndex = student.student_index || '<span style="color: #999; font-style: italic;">Not assigned</span>';
            html += `
                <tr class="student-item" data-student="${escapeHtml(student.name.toLowerCase())}">
                    <td>${studentIndex}</td>
                    <td>${escapeHtml(student.name)}</td>
                    <td>${escapeHtml(student.class)}</td>
                    <td style="max-width: 400px;">
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${student.subjects.sort().map(subject => 
                                `<span style="background: #e6f2ff; color: var(--primary-color); padding: 4px 10px; border-radius: 15px; font-size: 12px; font-weight: 600;">${escapeHtml(subject)}</span>`
                            ).join('')}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="closeRegisteredSubjectsModal()" class="btn btn-primary">Close</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        document.body.appendChild(modal);
        
        // Add close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRegisteredSubjectsModal();
            }
        });
        
    } catch (error) {
        console.error('Error loading registered subjects:', error);
        showError('Failed to load registered subjects. Please try again.', 'Error');
    }
}

// Switch between subject and student view
function switchSubjectView(view) {
    const subjectView = document.getElementById('subjectViewContent');
    const studentView = document.getElementById('studentViewContent');
    const subjectTab = document.getElementById('subjectViewTab');
    const studentTab = document.getElementById('studentViewTab');
    
    if (view === 'subject') {
        subjectView.style.display = 'block';
        studentView.style.display = 'none';
        subjectTab.classList.remove('btn-secondary');
        subjectTab.classList.add('btn-primary');
        studentTab.classList.remove('btn-primary');
        studentTab.classList.add('btn-secondary');
    } else {
        subjectView.style.display = 'none';
        studentView.style.display = 'block';
        studentTab.classList.remove('btn-secondary');
        studentTab.classList.add('btn-primary');
        subjectTab.classList.remove('btn-primary');
        subjectTab.classList.add('btn-secondary');
    }
}

// Filter subjects in subject view
function filterSubjects() {
    const searchTerm = document.getElementById('subjectSearchInput').value.toLowerCase();
    const subjectItems = document.querySelectorAll('#subjectsList .subject-item');
    
    subjectItems.forEach(item => {
        const subject = item.getAttribute('data-subject').toLowerCase();
        if (subject.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter students in student view
function filterStudents() {
    const searchTerm = document.getElementById('studentSearchInput').value.toLowerCase();
    const studentRows = document.querySelectorAll('#studentViewContent .student-item');
    
    studentRows.forEach(row => {
        const studentName = row.getAttribute('data-student');
        const rowText = row.textContent.toLowerCase();
        if (studentName.includes(searchTerm) || rowText.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Close registered subjects modal
function closeRegisteredSubjectsModal() {
    const modal = document.getElementById('registeredSubjectsModal');
    if (modal) {
        modal.remove();
    }
}

// Assign student indices to existing students who don't have one
async function assignStudentIndices() {
    if (!confirm('This will assign student indices to all students who don\'t have one yet.\n\nEach student will get a unique index based on their class (e.g., SB-001, SB-002 for SIGNALS BASIC).\n\nContinue?')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        // Get all students without indices, grouped by class
        const { data: students, error } = await supabase
            .from('users')
            .select('id, name, username, class, student_index')
            .eq('role', 'student')
            .or('student_index.is.null,student_index.eq.');
        
        if (error) {
            console.error('Error loading students:', error);
            showError('Failed to load students. Please try again.', 'Error');
            return;
        }
        
        if (!students || students.length === 0) {
            showSuccess('All students already have indices assigned!', 'No Action Needed');
            return;
        }
        
        // Group by class
        const studentsByClass = {};
        students.forEach(student => {
            if (!student.student_index && student.class) {
                if (!studentsByClass[student.class]) {
                    studentsByClass[student.class] = [];
                }
                studentsByClass[student.class].push(student);
            }
        });
        
        let assigned = 0;
        let errors = 0;
        
        // Assign indices for each class
        for (const [classId, classStudents] of Object.entries(studentsByClass)) {
            // Get existing indices for this class to find next number
            const { data: existingStudents } = await supabase
                .from('users')
                .select('student_index')
                .eq('role', 'student')
                .eq('class', classId)
                .not('student_index', 'is', null);
            
            // Extract numbers from existing indices
            const existingNumbers = (existingStudents || [])
                .map(s => {
                    if (!s.student_index) return 0;
                    const match = s.student_index.match(/\d+$/);
                    return match ? parseInt(match[0]) : 0;
                })
                .filter(n => n > 0);
            
            // Find starting number
            let nextNumber = 1;
            if (existingNumbers.length > 0) {
                const maxNumber = Math.max(...existingNumbers);
                nextNumber = maxNumber + 1;
            }
            
            const prefix = getClassIndexPrefix(classId);
            
            // Assign indices to students in this class
            for (const student of classStudents) {
                try {
                    const studentIndex = `${prefix}-${String(nextNumber).padStart(3, '0')}`;
                    
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ student_index: studentIndex })
                        .eq('id', student.id);
                    
                    if (updateError) {
                        console.error(`Error assigning index to ${student.name}:`, updateError);
                        errors++;
                    } else {
                        assigned++;
                    }
                    
                    nextNumber++;
                } catch (err) {
                    console.error(`Error assigning index to ${student.name}:`, err);
                    errors++;
                }
            }
        }
        
        if (assigned > 0) {
            showSuccess(`✅ Successfully assigned ${assigned} student index${assigned !== 1 ? 'ices' : ''}${errors > 0 ? `\n\n⚠️ ${errors} error(s) occurred.` : ''}`, 'Success');
            loadAllUsers();
        } else {
            showError('No indices were assigned. Please check for errors.', 'Error');
        }
        
    } catch (error) {
        console.error('Error assigning student indices:', error);
        showError('Failed to assign student indices. Please try again.', 'Error');
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
                <div class="table-wrapper">
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
        
        // Sort users - check if sort by ID is active
        const sortByID = window.usersSortByID || false;
        if (sortByID && role === 'student') {
            // Sort students by username (student ID) in ascending order
            roleUsers.sort((a, b) => {
                const idA = (a.username || '').toLowerCase();
                const idB = (b.username || '').toLowerCase();
                return idA.localeCompare(idB);
            });
        } else {
            // Sort users alphabetically by name (default)
            roleUsers.sort((a, b) => {
                const nameA = (a.name || a.username || '').toLowerCase();
                const nameB = (b.name || b.username || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        }
        
        roleUsers.forEach(user => {
            const className = user.class ? formatClassName(user.class) : '-';
            const registeredDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
            const nameDisplay = user.name || user.username || 'Unknown';
            // Subjects are now shown in the "View All Registered Subjects" modal - removed from here for cleaner display
            const studentIndex = user.student_index || (user.role === 'student' ? '<span style="color: #999; font-style: italic;">Not assigned</span>' : '-');
            
            html += `
                <tr>
                    <td>${user.role === 'student' ? escapeHtml(studentIndex) : '-'}</td>
                    <td>${escapeHtml(nameDisplay)}</td>
                    <td>${escapeHtml(user.username || 'N/A')}</td>
                    <td>${escapeHtml(user.email || 'N/A')}</td>
                    <td>${config.badge}</td>
                    <td>${className}</td>
                    <td>${registeredDate}</td>
                    <td>
                        <button onclick="editUser('${user.id}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;">Edit</button>
                        <button onclick="resetUserPassword('${user.id}', '${escapeHtml(nameDisplay)}')" class="btn btn-warning" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;">Reset Password</button>
                        ${user.role === 'student' ? `<button onclick="deleteStudent('${user.id}', '${escapeHtml(nameDisplay)}')" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">Delete</button>` : ''}
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

// Sort users by Student ID (username)
function sortUsersByID() {
    window.usersSortByID = !window.usersSortByID;
    loadAllUsers();
    const btn = event.target;
    if (window.usersSortByID) {
        btn.textContent = 'Sort by Name';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-info');
    } else {
        btn.textContent = 'Sort by Student ID';
        btn.classList.remove('btn-info');
        btn.classList.add('btn-secondary');
    }
}

// Delete student and all associated data
async function deleteStudent(studentId, studentName) {
    if (!confirm(`⚠️ WARNING: Delete Student\n\nThis will PERMANENTLY delete:\n- Student: ${studentName}\n- All exam attempts\n- All exam grades\n- All student responses\n- All associated data\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?`)) {
        return;
    }
    
    // Double confirmation
    if (!confirm(`FINAL CONFIRMATION\n\nYou are about to PERMANENTLY delete ${studentName} and ALL their data.\n\nType "DELETE" to confirm (case-sensitive):`)) {
        const confirmation = prompt('Type "DELETE" to confirm (case-sensitive):');
        if (confirmation !== 'DELETE') {
            showError('Deletion cancelled. Confirmation text did not match.', 'Cancelled');
            return;
        }
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        // Delete in order (respecting foreign key constraints)
        // 1. Delete student responses
        await supabase
            .from('student_responses')
            .delete()
            .eq('attempt_id', supabase.from('student_exam_attempts').select('id').eq('student_id', studentId));
        
        // 2. Delete exam attempts (this will cascade delete responses if cascade is set)
        const { data: attempts } = await supabase
            .from('student_exam_attempts')
            .select('id')
            .eq('student_id', studentId);
        
        if (attempts && attempts.length > 0) {
            const attemptIds = attempts.map(a => a.id);
            await supabase
                .from('student_responses')
                .delete()
                .in('attempt_id', attemptIds);
            
            await supabase
                .from('student_exam_attempts')
                .delete()
                .eq('student_id', studentId);
        }
        
        // 3. Delete exam grades
        await supabase
            .from('exam_grades')
            .delete()
            .eq('student_id', studentId);
        
        // 4. Delete user (student)
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', studentId);
        
        if (error) {
            console.error('Error deleting student:', error);
            showError('Failed to delete student. Please try again.', 'Error');
            return;
        }
        
        showSuccess(`Student "${studentName}" and all associated data deleted successfully.`, 'Success');
        loadAllUsers();
        loadResults();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting student:', error);
        showError('Failed to delete student. Please try again.', 'Error');
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
// Store registered subjects data globally for filtering
let registeredSubjectsData = null;

// View all registered subjects by students
async function viewAllRegisteredSubjects() {
    const modal = document.getElementById('registeredSubjectsModal');
    if (!modal) {
        showError('Modal not found. Please refresh the page.', 'Error');
        return;
    }
    
    modal.style.display = 'flex';
    const content = document.getElementById('registeredSubjectsContent');
    content.innerHTML = '<p class="empty-state">Loading registered subjects...</p>';
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        // Get all students with their registered subjects
        const { data: students, error } = await supabase
            .from('users')
            .select('id, name, username, class, courses')
            .eq('role', 'student')
            .order('class', { ascending: true })
            .order('username', { ascending: true });
        
        if (error) throw error;
        
        if (!students || students.length === 0) {
            content.innerHTML = '<p class="empty-state">No students found.</p>';
            return;
        }
        
        // Group subjects by subject name
        const subjectsMap = {};
        const classSubjectsMap = {}; // Track subjects by class
        
        students.forEach(student => {
            const courses = student.courses || [];
            const className = formatClassName(student.class || 'unknown');
            
            courses.forEach(subject => {
                if (!subjectsMap[subject]) {
                    subjectsMap[subject] = [];
                }
                
                // Check if student already added (avoid duplicates)
                if (!subjectsMap[subject].some(s => s.id === student.id)) {
                    subjectsMap[subject].push({
                        id: student.id,
                        name: student.name || student.username || 'Unknown',
                        username: student.username || 'N/A',
                        class: student.class || 'unknown',
                        className: className
                    });
                }
                
                // Track by class
                if (!classSubjectsMap[className]) {
                    classSubjectsMap[className] = {};
                }
                if (!classSubjectsMap[className][subject]) {
                    classSubjectsMap[className][subject] = [];
                }
                if (!classSubjectsMap[className][subject].some(s => s.id === student.id)) {
                    classSubjectsMap[className][subject].push({
                        id: student.id,
                        name: student.name || student.username || 'Unknown',
                        username: student.username || 'N/A'
                    });
                }
            });
        });
        
        // Store data globally for filtering
        registeredSubjectsData = { subjectsMap, classSubjectsMap };
        
        // Populate subject filter dropdown
        const subjectFilter = document.getElementById('subjectViewFilter');
        if (subjectFilter) {
            const allSubjects = Object.keys(subjectsMap).sort();
            subjectFilter.innerHTML = '<option value="all">All Subjects</option>' +
                allSubjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join('');
        }
        
        // Display organized by subject
        displayRegisteredSubjects(subjectsMap, classSubjectsMap);
        
    } catch (error) {
        console.error('Error loading registered subjects:', error);
        content.innerHTML = '<p class="empty-state" style="color: red;">Error loading registered subjects. Please try again.</p>';
    }
}

// Display registered subjects in organized view
function displayRegisteredSubjects(subjectsMap, classSubjectsMap) {
    const content = document.getElementById('registeredSubjectsContent');
    const subjectFilter = document.getElementById('subjectViewFilter')?.value || 'all';
    const classFilter = document.getElementById('subjectViewClassFilter')?.value || 'all';
    
    let html = '';
    
    // Filter subjects
    let filteredSubjects = Object.keys(subjectsMap);
    if (subjectFilter !== 'all') {
        filteredSubjects = filteredSubjects.filter(s => s === subjectFilter);
    }
    
    if (filteredSubjects.length === 0) {
        content.innerHTML = '<p class="empty-state">No subjects found matching the filter.</p>';
        return;
    }
    
    // Display by subject (organized view)
    filteredSubjects.sort().forEach(subject => {
        let students = subjectsMap[subject];
        
        // Filter by class if needed
        if (classFilter !== 'all') {
            students = students.filter(s => s.class === classFilter);
        }
        
        if (students.length === 0) return;
        
        // Group students by class
        const studentsByClass = {};
        students.forEach(student => {
            if (!studentsByClass[student.className]) {
                studentsByClass[student.className] = [];
            }
            studentsByClass[student.className].push(student);
        });
        
        html += `
            <div class="card" style="margin-bottom: 20px;">
                <h4 style="color: var(--primary-color); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-color);">
                    📖 ${escapeHtml(subject)}
                    <span style="font-size: 14px; font-weight: normal; color: #666;">
                        (${students.length} ${students.length === 1 ? 'student' : 'students'})
                    </span>
                </h4>
        `;
        
        // Display students grouped by class
        Object.keys(studentsByClass).sort().forEach(className => {
            const classStudents = studentsByClass[className];
            html += `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #666; font-size: 14px;">${escapeHtml(className)}:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            `;
            
            classStudents.forEach(student => {
                html += `
                    <span style="background: #e6f2ff; padding: 6px 12px; border-radius: 5px; font-size: 13px; display: inline-block;">
                        ${escapeHtml(student.name)} <small style="color: #666;">(${escapeHtml(student.username)})</small>
                    </span>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    if (html === '') {
        content.innerHTML = '<p class="empty-state">No students registered for the selected filters.</p>';
    } else {
        content.innerHTML = html;
    }
}

// Filter subject view
function filterSubjectView() {
    // Use stored data to filter without reloading
    if (registeredSubjectsData) {
        displayRegisteredSubjects(registeredSubjectsData.subjectsMap, registeredSubjectsData.classSubjectsMap);
    } else {
        // If no data stored, reload
        viewAllRegisteredSubjects();
    }
}

// Close registered subjects modal
function closeRegisteredSubjectsModal() {
    const modal = document.getElementById('registeredSubjectsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export registered subjects to CSV
function exportRegisteredSubjectsToCSV() {
    try {
        const content = document.getElementById('registeredSubjectsContent');
        const cards = content.querySelectorAll('.card');
        
        if (cards.length === 0) {
            showError('No data to export', 'Error');
            return;
        }
        
        let csv = 'Subject,Class,Student Name,Student ID\n';
        
        cards.forEach(card => {
            const subject = card.querySelector('h4')?.textContent?.replace(/📖\s*/, '').split('(')[0].trim() || 'Unknown';
            const classDivs = card.querySelectorAll('div[style*="margin-bottom: 15px"]');
            
            classDivs.forEach(classDiv => {
                const className = classDiv.querySelector('strong')?.textContent?.replace(':', '').trim() || 'Unknown';
                const studentSpans = classDiv.querySelectorAll('span[style*="background: #e6f2ff"]');
                
                studentSpans.forEach(span => {
                    const text = span.textContent.trim();
                    const match = text.match(/^(.+?)\s*\((.+?)\)$/);
                    const studentName = match ? match[1].trim() : text;
                    const studentId = match ? match[2].trim() : 'N/A';
                    
                    csv += `"${escapeHtml(subject)}","${escapeHtml(className)}","${escapeHtml(studentName)}","${escapeHtml(studentId)}"\n`;
                });
            });
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `registered_subjects_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('Registered subjects exported successfully!', 'Success');
        
    } catch (error) {
        console.error('Error exporting registered subjects:', error);
        showError('Failed to export registered subjects. Please try again.', 'Error');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('registeredSubjectsModal');
    if (event.target == modal) {
        closeRegisteredSubjectsModal();
    }
}

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
                student:users!exam_grades_student_id_fkey(id, name, username, class, student_index),
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
                student:users!exam_grades_student_id_fkey(id, name, username, class, student_index),
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
    try {
        const gradeA = parseInt(document.getElementById('gradeA').value);
        const gradeB = parseInt(document.getElementById('gradeB').value);
        const gradeC = parseInt(document.getElementById('gradeC').value);
        const gradeD = parseInt(document.getElementById('gradeD').value);
        
        // Validate inputs are numbers
        if (isNaN(gradeA) || isNaN(gradeB) || isNaN(gradeC) || isNaN(gradeD)) {
            showError('Please enter valid numbers for all grade thresholds.', 'Invalid Input');
            return;
        }
        
        // Validate thresholds
        if (gradeA < gradeB || gradeB < gradeC || gradeC < gradeD || gradeD < 0 || gradeA > 100) {
            showError('Invalid grade thresholds. Grade A must be highest (≤100), followed by B, C, and D (≥0).', 'Error');
            return;
        }
        
        // Store in localStorage (in production, store in database)
        localStorage.setItem('gradeThresholds', JSON.stringify({
            A: gradeA,
            B: gradeB,
            C: gradeC,
            D: gradeD
        }));
        
        showSuccess(`Grade thresholds saved successfully!\n\nA: ${gradeA}%+\nB: ${gradeB}%+\nC: ${gradeC}%+\nD: ${gradeD}%+\nF: <${gradeD}%`, 'Success');
        
        // Refresh final grades to apply new thresholds
        loadFinalGrades();
        
    } catch (error) {
        console.error('Error saving grade thresholds:', error);
        showError('Failed to save grade thresholds. Please try again.', 'Error');
    }
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

// ==================== DATABASE MANAGEMENT ====================

// Load database statistics
async function loadDatabaseStats() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get user counts
        const { data: users } = await supabase
            .from('users')
            .select('id', { count: 'exact' });
        
        const { data: students } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('role', 'student');
        
        const { data: lecturers } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('role', 'lecturer');
        
        // Get exam counts
        const { data: exams } = await supabase
            .from('exams')
            .select('id', { count: 'exact' });
        
        // Get grade counts
        const { data: grades } = await supabase
            .from('exam_grades')
            .select('id', { count: 'exact' });
        
        // Get materials count (if table exists)
        let materialsCount = 0;
        try {
            const { data: materials } = await supabase
                .from('materials')
                .select('id', { count: 'exact' });
            materialsCount = materials?.length || 0;
        } catch (e) {
            // Materials table might not exist
            materialsCount = 0;
        }
        
        // Update display
        document.getElementById('dbTotalUsers').textContent = users?.length || 0;
        document.getElementById('dbStudents').textContent = students?.length || 0;
        document.getElementById('dbLecturers').textContent = lecturers?.length || 0;
        document.getElementById('dbExams').textContent = exams?.length || 0;
        document.getElementById('dbGrades').textContent = grades?.length || 0;
        document.getElementById('dbMaterials').textContent = materialsCount;
        
    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

// Backup all data
async function backupAllData() {
    if (!confirm('This will create a backup of ALL data. Continue?')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Creating backup... This may take a moment.', 'Backup in Progress');
        
        // Get all data with proper error handling
        // Supabase queries always resolve (never reject), so we check the error property
        const [usersResult, examsResult, gradesResult, attemptsResult, questionsResult, responsesResult, materialsResult] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('exams').select('*'),
            supabase.from('exam_grades').select('*'),
            supabase.from('student_exam_attempts').select('*'),
            supabase.from('questions').select('*'),
            supabase.from('student_responses').select('*'),
            supabase.from('materials').select('*')
        ]);
        
        // Check for critical errors (but allow missing tables to return empty arrays)
        const criticalErrors = [];
        
        if (usersResult.error) {
            const errorMsg = usersResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Users: ${errorMsg}`);
            }
        }
        
        if (examsResult.error) {
            const errorMsg = examsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Exams: ${errorMsg}`);
            }
        }
        
        if (gradesResult.error) {
            const errorMsg = gradesResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Grades: ${errorMsg}`);
            }
        }
        
        if (attemptsResult.error) {
            const errorMsg = attemptsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Attempts: ${errorMsg}`);
            }
        }
        
        if (questionsResult.error) {
            const errorMsg = questionsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Questions: ${errorMsg}`);
            }
        }
        
        if (responsesResult.error) {
            const errorMsg = responsesResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Responses: ${errorMsg}`);
            }
        }
        
        // Materials table might not exist, that's okay - just log a warning
        if (materialsResult.error) {
            const errorMsg = materialsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                console.warn('Materials table error:', errorMsg);
            } else {
                console.warn('Materials table not found, continuing with empty materials array');
            }
        }
        
        if (criticalErrors.length > 0) {
            throw new Error(criticalErrors.join('; '));
        }
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                users: usersResult.data || [],
                exams: examsResult.data || [],
                grades: gradesResult.data || [],
                attempts: attemptsResult.data || [],
                questions: questionsResult.data || [],
                responses: responsesResult.data || [],
                materials: materialsResult.data || []
            }
        };
        
        // Save to Supabase storage or download as JSON
        const json = JSON.stringify(backup, null, 2);
        const filename = `backup_all_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        // Always download file first (this always works)
        downloadJSON(json, filename);
        
        // Try to save to Supabase storage (optional - may fail if bucket doesn't exist)
        let storageSaved = false;
        try {
            const file = new Blob([json], { type: 'application/json' });
            const { data, error } = await supabase.storage
                .from('backups')
                .upload(filename, file, {
                    contentType: 'application/json',
                    upsert: false
                });
            
            if (!error) {
                storageSaved = true;
            } else if (error.message && error.message.includes('Bucket not found')) {
                console.warn('Supabase storage bucket "backups" does not exist. Backup downloaded only.');
            } else if (error.message && error.message !== 'The resource already exists') {
                console.warn('Could not save to Supabase storage:', error.message);
            }
        } catch (e) {
            console.warn('Supabase storage not available:', e.message || e);
        }
        
        const successMsg = storageSaved 
            ? `Backup created successfully!\n\nFile: ${filename}\n\n✅ Saved to Supabase storage and downloaded.`
            : `Backup created successfully!\n\nFile: ${filename}\n\n✅ Downloaded to your device.\n\n⚠️ Note: Supabase storage bucket not configured. Backup saved locally only.`;
        
        showSuccess(successMsg, 'Backup Complete');
        
    } catch (error) {
        console.error('Error creating backup:', error);
        showError(`Failed to create backup: ${error.message || 'Unknown error'}\n\nPlease try again.`, 'Error');
    }
}

// Backup users only
async function backupUsers() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Creating users backup...', 'Backup in Progress');
        
        const { data: users, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) {
            const errorMsg = error.message || 'Unknown error';
            if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
                throw new Error(`Users table does not exist: ${errorMsg}`);
            }
            throw new Error(`Failed to fetch users: ${errorMsg}`);
        }
        
        const backup = {
            timestamp: new Date().toISOString(),
            type: 'users',
            data: users || []
        };
        
        const json = JSON.stringify(backup, null, 2);
        const filename = `backup_users_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        // Always download file first
        downloadJSON(json, filename);
        
        // Try to save to Supabase storage (optional)
        let storageSaved = false;
        try {
            const file = new Blob([json], { type: 'application/json' });
            const { data, error } = await supabase.storage
                .from('backups')
                .upload(filename, file, {
                    contentType: 'application/json',
                    upsert: false
                });
            
            if (!error) {
                storageSaved = true;
            }
        } catch (e) {
            console.warn('Supabase storage not available:', e.message || e);
        }
        
        const successMsg = storageSaved 
            ? `Users backup created successfully!\n\nFile: ${filename}\n\n✅ Saved to Supabase storage and downloaded.`
            : `Users backup created successfully!\n\nFile: ${filename}\n\n✅ Downloaded to your device.`;
        
        showSuccess(successMsg, 'Backup Complete');
        
    } catch (error) {
        console.error('Error backing up users:', error);
        showError(`Failed to backup users: ${error.message || 'Unknown error'}`, 'Error');
    }
}

// Backup exams and results
async function backupExams() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Creating exams backup...', 'Backup in Progress');
        
        // Supabase queries always resolve (never reject), so we check the error property
        const [examsResult, gradesResult, attemptsResult, questionsResult, responsesResult] = await Promise.all([
            supabase.from('exams').select('*'),
            supabase.from('exam_grades').select('*'),
            supabase.from('student_exam_attempts').select('*'),
            supabase.from('questions').select('*'),
            supabase.from('student_responses').select('*')
        ]);
        
        // Check for critical errors
        const criticalErrors = [];
        
        if (examsResult.error) {
            const errorMsg = examsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Exams: ${errorMsg}`);
            }
        }
        
        if (gradesResult.error) {
            const errorMsg = gradesResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Grades: ${errorMsg}`);
            }
        }
        
        if (attemptsResult.error) {
            const errorMsg = attemptsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Attempts: ${errorMsg}`);
            }
        }
        
        if (questionsResult.error) {
            const errorMsg = questionsResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Questions: ${errorMsg}`);
            }
        }
        
        if (responsesResult.error) {
            const errorMsg = responsesResult.error.message || 'Unknown error';
            if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation')) {
                criticalErrors.push(`Responses: ${errorMsg}`);
            }
        }
        
        if (criticalErrors.length > 0) {
            throw new Error(criticalErrors.join('; '));
        }
        
        const backup = {
            timestamp: new Date().toISOString(),
            type: 'exams_and_results',
            data: {
                exams: examsResult.data || [],
                grades: gradesResult.data || [],
                attempts: attemptsResult.data || [],
                questions: questionsResult.data || [],
                responses: responsesResult.data || []
            }
        };
        
        const json = JSON.stringify(backup, null, 2);
        const filename = `backup_exams_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        // Always download file first
        downloadJSON(json, filename);
        
        // Try to save to Supabase storage (optional)
        let storageSaved = false;
        try {
            const file = new Blob([json], { type: 'application/json' });
            const { data, error } = await supabase.storage
                .from('backups')
                .upload(filename, file, {
                    contentType: 'application/json',
                    upsert: false
                });
            
            if (!error) {
                storageSaved = true;
            }
        } catch (e) {
            console.warn('Supabase storage not available:', e.message || e);
        }
        
        const successMsg = storageSaved 
            ? `Exams backup created successfully!\n\nFile: ${filename}\n\n✅ Saved to Supabase storage and downloaded.`
            : `Exams backup created successfully!\n\nFile: ${filename}\n\n✅ Downloaded to your device.`;
        
        showSuccess(successMsg, 'Backup Complete');
        
    } catch (error) {
        console.error('Error backing up exams:', error);
        showError(`Failed to backup exams: ${error.message || 'Unknown error'}`, 'Error');
    }
}

// Backup materials
async function backupMaterials() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Creating materials backup...', 'Backup in Progress');
        
        const { data: materials, error } = await supabase
            .from('materials')
            .select('*');
        
        if (error) {
            const errorMsg = error.message || 'Unknown error';
            if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
                throw new Error(`Materials table does not exist: ${errorMsg}`);
            }
            throw new Error(`Failed to fetch materials: ${errorMsg}`);
        }
        
        const backup = {
            timestamp: new Date().toISOString(),
            type: 'materials',
            data: materials || []
        };
        
        const json = JSON.stringify(backup, null, 2);
        const filename = `backup_materials_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        
        // Always download file first
        downloadJSON(json, filename);
        
        // Try to save to Supabase storage (optional)
        let storageSaved = false;
        try {
            const file = new Blob([json], { type: 'application/json' });
            const { data, error } = await supabase.storage
                .from('backups')
                .upload(filename, file, {
                    contentType: 'application/json',
                    upsert: false
                });
            
            if (!error) {
                storageSaved = true;
            }
        } catch (e) {
            console.warn('Supabase storage not available:', e.message || e);
        }
        
        const successMsg = storageSaved 
            ? `Materials backup created successfully!\n\nFile: ${filename}\n\n✅ Saved to Supabase storage and downloaded.`
            : `Materials backup created successfully!\n\nFile: ${filename}\n\n✅ Downloaded to your device.`;
        
        showSuccess(successMsg, 'Backup Complete');
        
    } catch (error) {
        console.error('Error backing up materials:', error);
        showError(`Failed to backup materials: ${error.message || 'Unknown error'}`, 'Error');
    }
}

// Clear test/demo data only
async function clearTestData() {
    const confirmMsg = `⚠️ WARNING: This will delete TEST/DEMO data only:\n\n` +
        `- Users with usernames: lecturer1, student1, lecturer, student, demo_lecturer, demo_student\n` +
        `- Exams created by demo accounts\n` +
        `- Materials uploaded by demo accounts\n\n` +
        `Real user data will be preserved.\n\n` +
        `Have you created a backup? Continue?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    if (!confirm('⚠️ FINAL CONFIRMATION: Delete test/demo data? This cannot be undone!')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Clearing test data...', 'In Progress');
        
        // Get demo user IDs
        const demoUsernames = ['lecturer1', 'student1', 'lecturer', 'student', 'demo_lecturer', 'demo_student'];
        const { data: demoUsers } = await supabase
            .from('users')
            .select('id')
            .in('username', demoUsernames);
        
        const demoUserIds = demoUsers?.map(u => u.id) || [];
        
        if (demoUserIds.length === 0) {
            showSuccess('No test/demo data found to clear.', 'Complete');
            return;
        }
        
        // Delete in order (respecting foreign keys)
        await supabase.from('student_responses').delete().in('student_id', demoUserIds);
        await supabase.from('exam_grades').delete().in('student_id', demoUserIds);
        await supabase.from('student_exam_attempts').delete().in('student_id', demoUserIds);
        
        // Delete exams created by demo lecturers
        const { data: demoExams } = await supabase
            .from('exams')
            .select('id')
            .in('lecturer_id', demoUserIds);
        
        const demoExamIds = demoExams?.map(e => e.id) || [];
        
        if (demoExamIds.length > 0) {
            await supabase.from('student_responses').delete().in('exam_id', demoExamIds);
            await supabase.from('exam_grades').delete().in('exam_id', demoExamIds);
            await supabase.from('student_exam_attempts').delete().in('exam_id', demoExamIds);
            await supabase.from('questions').delete().in('exam_id', demoExamIds);
            await supabase.from('exams').delete().in('id', demoExamIds);
        }
        
        // Delete materials uploaded by demo users
        try {
            await supabase.from('materials').delete().in('lecturer_id', demoUserIds);
        } catch (e) {
            // Materials table might not exist
        }
        
        // Delete demo users
        await supabase.from('users').delete().in('id', demoUserIds);
        
        showSuccess(`Test data cleared successfully!\n\nDeleted ${demoUserIds.length} demo users.`, 'Complete');
        loadDatabaseStats();
        loadAllUsers();
        
    } catch (error) {
        console.error('Error clearing test data:', error);
        showError('Failed to clear test data. Please try again.', 'Error');
    }
}

// Delete data by class
async function deleteDataByClass() {
    const classId = prompt('Enter the class ID to delete (e.g., signals-basic, regimental-basic):\n\n⚠️ WARNING: This will delete ALL data for this class including:\n- All students in this class\n- All exams for this class\n- All results for this class\n\nType the class ID to confirm:');
    
    if (!classId || classId.trim() === '') {
        return;
    }
    
    const className = formatClassName(classId.trim());
    
    if (!confirm(`⚠️⚠️⚠️ FINAL CONFIRMATION ⚠️⚠️⚠️\n\nYou are about to DELETE ALL DATA for:\n\nClass: ${className}\n\nThis will delete:\n- All students in this class\n- All exams for this class\n- All exam results for this class\n- All questions for exams in this class\n- All student responses for exams in this class\n\nTHIS CANNOT BE UNDONE!\n\nHave you created a backup?\n\nType "DELETE ${classId.toUpperCase()}" to confirm:`)) {
        return;
    }
    
    const finalConfirm = prompt(`Type "DELETE ${classId.toUpperCase()}" to confirm deletion:`);
    if (finalConfirm !== `DELETE ${classId.toUpperCase()}`) {
        showError('Deletion cancelled. You must type the exact confirmation text.', 'Cancelled');
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Deleting class data... This may take a moment.', 'In Progress');
        
        // Get all students in this class
        const { data: classStudents } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('class', classId.trim());
        
        const studentIds = classStudents?.map(s => s.id) || [];
        
        // Get all exams for this class
        const { data: classExams } = await supabase
            .from('exams')
            .select('id')
            .eq('class_id', classId.trim());
        
        const examIds = classExams?.map(e => e.id) || [];
        
        let deletedCounts = {
            responses: 0,
            grades: 0,
            attempts: 0,
            questions: 0,
            exams: 0,
            students: 0
        };
        
        // Delete in order (respecting foreign keys)
        if (examIds.length > 0) {
            // Delete student responses for these exams
            const { data: responses } = await supabase
                .from('student_responses')
                .select('id')
                .in('exam_id', examIds);
            
            if (responses && responses.length > 0) {
                const responseIds = responses.map(r => r.id);
                await supabase.from('student_responses').delete().in('id', responseIds);
                deletedCounts.responses = responses.length;
            }
            
            // Delete exam grades for these exams
            const { data: grades } = await supabase
                .from('exam_grades')
                .select('id')
                .in('exam_id', examIds);
            
            if (grades && grades.length > 0) {
                const gradeIds = grades.map(g => g.id);
                await supabase.from('exam_grades').delete().in('id', gradeIds);
                deletedCounts.grades = grades.length;
            }
            
            // Delete exam attempts for these exams
            const { data: attempts } = await supabase
                .from('student_exam_attempts')
                .select('id')
                .in('exam_id', examIds);
            
            if (attempts && attempts.length > 0) {
                const attemptIds = attempts.map(a => a.id);
                await supabase.from('student_exam_attempts').delete().in('id', attemptIds);
                deletedCounts.attempts = attempts.length;
            }
            
            // Delete questions for these exams
            const { data: questions } = await supabase
                .from('questions')
                .select('id')
                .in('exam_id', examIds);
            
            if (questions && questions.length > 0) {
                const questionIds = questions.map(q => q.id);
                await supabase.from('questions').delete().in('id', questionIds);
                deletedCounts.questions = questions.length;
            }
            
            // Delete exams
            await supabase.from('exams').delete().in('id', examIds);
            deletedCounts.exams = examIds.length;
        }
        
        // Delete student data (responses, grades, attempts) for students in this class
        if (studentIds.length > 0) {
            // Delete student responses
            const { data: studentResponses } = await supabase
                .from('student_responses')
                .select('id')
                .in('student_id', studentIds);
            
            if (studentResponses && studentResponses.length > 0) {
                const responseIds = studentResponses.map(r => r.id);
                await supabase.from('student_responses').delete().in('id', responseIds);
                deletedCounts.responses += studentResponses.length;
            }
            
            // Delete exam grades
            const { data: studentGrades } = await supabase
                .from('exam_grades')
                .select('id')
                .in('student_id', studentIds);
            
            if (studentGrades && studentGrades.length > 0) {
                const gradeIds = studentGrades.map(g => g.id);
                await supabase.from('exam_grades').delete().in('id', gradeIds);
                deletedCounts.grades += studentGrades.length;
            }
            
            // Delete exam attempts
            const { data: studentAttempts } = await supabase
                .from('student_exam_attempts')
                .select('id')
                .in('student_id', studentIds);
            
            if (studentAttempts && studentAttempts.length > 0) {
                const attemptIds = studentAttempts.map(a => a.id);
                await supabase.from('student_exam_attempts').delete().in('id', attemptIds);
                deletedCounts.attempts += studentAttempts.length;
            }
            
            // Delete students
            await supabase.from('users').delete().in('id', studentIds);
            deletedCounts.students = studentIds.length;
        }
        
        const summary = `Class data deleted successfully!\n\nClass: ${className}\n\nDeleted:\n` +
            `- Students: ${deletedCounts.students}\n` +
            `- Exams: ${deletedCounts.exams}\n` +
            `- Exam grades: ${deletedCounts.grades}\n` +
            `- Exam attempts: ${deletedCounts.attempts}\n` +
            `- Questions: ${deletedCounts.questions}\n` +
            `- Student responses: ${deletedCounts.responses}`;
        
        showSuccess(summary, 'Complete');
        loadDatabaseStats();
        loadAllUsers();
        loadResults();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting class data:', error);
        showError(`Failed to delete class data: ${error.message}\n\nSome data may have been deleted. Please check the database.`, 'Error');
    }
}

// Clear all data
async function clearAllData() {
    const confirmMsg = `⚠️⚠️⚠️ EXTREME WARNING ⚠️⚠️⚠️\n\n` +
        `This will DELETE EVERYTHING:\n` +
        `- ALL users (students, lecturers, admins)\n` +
        `- ALL exams, questions, and results\n` +
        `- ALL materials and progress\n` +
        `- ALL data in the database\n\n` +
        `THIS CANNOT BE UNDONE!\n\n` +
        `Have you created a backup? Type "DELETE ALL" to confirm:`;
    
    const userInput = prompt(confirmMsg);
    
    if (userInput !== 'DELETE ALL') {
        showError('Operation cancelled. You must type "DELETE ALL" to confirm.', 'Cancelled');
        return;
    }
    
    if (!confirm('⚠️ FINAL CONFIRMATION: Delete ALL data? This is your last chance!')) {
        return;
    }
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            showError('Database connection error', 'Error');
            return;
        }
        
        showSuccess('Clearing all data... This may take a moment.', 'In Progress');
        
        let deletedCounts = {
            responses: 0,
            grades: 0,
            attempts: 0,
            questions: 0,
            exams: 0,
            materials: 0,
            progress: 0,
            users: 0
        };
        
        // Delete in order (respecting foreign key constraints)
        // Get all IDs first, then delete them (Supabase requires a filter for delete)
        try {
            // Delete student responses - get all IDs first
            const { data: allResponses } = await supabase.from('student_responses').select('id');
            if (allResponses && allResponses.length > 0) {
                const responseIds = allResponses.map(r => r.id);
                const { error: respError } = await supabase
                    .from('student_responses')
                    .delete()
                    .in('id', responseIds);
                if (!respError) deletedCounts.responses = allResponses.length;
            }
        } catch (e) {
            console.warn('Error deleting responses:', e);
        }
        
        try {
            // Delete exam grades
            const { data: allGrades } = await supabase.from('exam_grades').select('id');
            if (allGrades && allGrades.length > 0) {
                const gradeIds = allGrades.map(g => g.id);
                const { error: gradesError } = await supabase
                    .from('exam_grades')
                    .delete()
                    .in('id', gradeIds);
                if (!gradesError) deletedCounts.grades = allGrades.length;
            }
        } catch (e) {
            console.warn('Error deleting grades:', e);
        }
        
        try {
            // Delete exam attempts
            const { data: allAttempts } = await supabase.from('student_exam_attempts').select('id');
            if (allAttempts && allAttempts.length > 0) {
                const attemptIds = allAttempts.map(a => a.id);
                const { error: attemptsError } = await supabase
                    .from('student_exam_attempts')
                    .delete()
                    .in('id', attemptIds);
                if (!attemptsError) deletedCounts.attempts = allAttempts.length;
            }
        } catch (e) {
            console.warn('Error deleting attempts:', e);
        }
        
        try {
            // Delete questions
            const { data: allQuestions } = await supabase.from('questions').select('id');
            if (allQuestions && allQuestions.length > 0) {
                const questionIds = allQuestions.map(q => q.id);
                const { error: questionsError } = await supabase
                    .from('questions')
                    .delete()
                    .in('id', questionIds);
                if (!questionsError) deletedCounts.questions = allQuestions.length;
            }
        } catch (e) {
            console.warn('Error deleting questions:', e);
        }
        
        try {
            // Delete exams
            const { data: allExams } = await supabase.from('exams').select('id');
            if (allExams && allExams.length > 0) {
                const examIds = allExams.map(e => e.id);
                const { error: examsError } = await supabase
                    .from('exams')
                    .delete()
                    .in('id', examIds);
                if (!examsError) deletedCounts.exams = allExams.length;
            }
        } catch (e) {
            console.warn('Error deleting exams:', e);
        }
        
        // Delete LMS data if tables exist
        try {
            const { data: allMaterials } = await supabase.from('materials').select('id');
            if (allMaterials && allMaterials.length > 0) {
                const materialIds = allMaterials.map(m => m.id);
                const { error: materialsError } = await supabase
                    .from('materials')
                    .delete()
                    .in('id', materialIds);
                if (!materialsError) deletedCounts.materials = allMaterials.length;
            }
        } catch (e) {
            console.warn('Materials table might not exist or error:', e);
        }
        
        try {
            const { data: allProgress } = await supabase.from('student_progress').select('id');
            if (allProgress && allProgress.length > 0) {
                const progressIds = allProgress.map(p => p.id);
                const { error: progressError } = await supabase
                    .from('student_progress')
                    .delete()
                    .in('id', progressIds);
                if (!progressError) deletedCounts.progress = allProgress.length;
            }
        } catch (e) {
            console.warn('Progress table might not exist or error:', e);
        }
        
        // Delete users last (may have foreign key constraints)
        // Note: We need to preserve at least one admin user or the current admin
        try {
            // Get current admin user ID to preserve
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
            
            // Get all users
            const { data: allUsers } = await supabase.from('users').select('id');
            if (allUsers && allUsers.length > 0) {
                let userIdsToDelete = allUsers.map(u => u.id);
                
                // Preserve current admin if exists
                if (currentUser && currentUser.role === 'admin') {
                    userIdsToDelete = userIdsToDelete.filter(id => id !== currentUser.id);
                    deletedCounts.users = `${userIdsToDelete.length} (current admin preserved)`;
                } else {
                    deletedCounts.users = allUsers.length;
                }
                
                if (userIdsToDelete.length > 0) {
                    const { error: usersError } = await supabase
                        .from('users')
                        .delete()
                        .in('id', userIdsToDelete);
                    if (usersError) {
                        console.error('Error deleting users:', usersError);
                        deletedCounts.users = 'error';
                    }
                }
            }
        } catch (e) {
            console.warn('Error deleting users:', e);
        }
        
        const summary = `Data cleared successfully!\n\n` +
            `Deleted:\n` +
            `- Student responses: ${deletedCounts.responses}\n` +
            `- Exam grades: ${deletedCounts.grades}\n` +
            `- Exam attempts: ${deletedCounts.attempts}\n` +
            `- Questions: ${deletedCounts.questions}\n` +
            `- Exams: ${deletedCounts.exams}\n` +
            `- Materials: ${deletedCounts.materials}\n` +
            `- Progress records: ${deletedCounts.progress}\n` +
            `- Users: ${deletedCounts.users}`;
        
        showSuccess(summary, 'Complete');
        loadDatabaseStats();
        loadAllUsers();
        loadResults();
        loadStatistics();
        
    } catch (error) {
        console.error('Error clearing all data:', error);
        showError(`Failed to clear data: ${error.message}\n\nSome data may have been deleted. Please check the database.`, 'Error');
    }
}

// Download JSON file
function downloadJSON(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
