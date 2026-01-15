// Optimized Admin Portal Functions
// This file shows how to integrate performance optimizations into admin-portal.js

// Include performance optimizer before using these functions
// <script src="js/performance-optimizer.js"></script>

/**
 * Optimized version of loadResults() with caching and rate limiting
 */
async function loadResultsOptimized() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        const classFilter = document.getElementById('filterClass').value;
        const subjectFilter = document.getElementById('filterSubject').value;
        const studentFilter = document.getElementById('filterStudent').value.toLowerCase();
        
        // Create cache key based on filters
        const cacheKey = `results_${classFilter}_${subjectFilter}_${studentFilter}`;
        
        // Use optimized query with caching
        const grades = await window.PerformanceOptimizer.optimizedQuery(
            async () => {
                // Reload students to get latest (with caching)
                await loadAllStudentsOptimized();
                
                // Build query for exam grades with specific fields (not *)
                let query = supabase
                    .from('exam_grades')
                    .select(`
                        id,
                        student_id,
                        exam_id,
                        percentage,
                        scaled_score,
                        objective_score,
                        written_score,
                        created_at,
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
                    .order('created_at', { ascending: false })
                    .limit(1000); // Limit to prevent huge queries
                
                // Apply filters
                if (classFilter !== 'all') {
                    const { data: studentsInClass } = await supabase
                        .from('users')
                        .select('id')
                        .eq('role', 'student')
                        .eq('class', classFilter)
                        .limit(500); // Limit student query
                    
                    const studentIds = studentsInClass?.map(s => s.id) || [];
                    if (studentIds.length > 0) {
                        query = query.in('student_id', studentIds);
                    } else {
                        return [];
                    }
                }
                
                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            },
            cacheKey,
            30000 // 30 second cache
        );
        
        // Apply client-side filters
        let filteredResults = grades;
        
        if (subjectFilter !== 'all') {
            filteredResults = filteredResults.filter(r => r.exam?.subject === subjectFilter);
        }
        
        // Display results
        displayResultsGroupedByClass(filteredResults);
        
    } catch (error) {
        console.error('Error loading results:', error);
        showError('Failed to load results. Please try again.', 'Error');
    }
}

/**
 * Optimized version of loadAllStudents() with caching
 */
async function loadAllStudentsOptimized() {
    const cacheKey = 'all_students';
    
    const students = await window.PerformanceOptimizer.optimizedQuery(
        async () => {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await supabase
                .from('users')
                .select('id, username, name, class, email, created_at')
                .eq('role', 'student')
                .order('created_at', { ascending: false })
                .limit(2000); // Reasonable limit
            
            if (error) throw error;
            return data || [];
        },
        cacheKey,
        60000 // 1 minute cache
    );
    
    allStudents = students;
    return students;
}

/**
 * Optimized version of loadFinalGrades() with caching
 */
async function loadFinalGradesOptimized() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        const cacheKey = 'final_grades_all';
        
        const grades = await window.PerformanceOptimizer.optimizedQuery(
            async () => {
                const { data, error } = await supabase
                    .from('exam_grades')
                    .select(`
                        id,
                        student_id,
                        exam_id,
                        percentage,
                        scaled_score,
                        objective_score,
                        written_score,
                        student:users!exam_grades_student_id_fkey(id, name, class),
                        exam:exams!exam_grades_exam_id_fkey(
                            id, 
                            subject, 
                            class_id, 
                            exam_type,
                            lecturer_id,
                            lecturer:users!exams_lecturer_id_fkey(id, name, username)
                        )
                    `)
                    .limit(5000); // Limit for performance
                
                if (error) throw error;
                return data || [];
            },
            cacheKey,
            60000 // 1 minute cache
        );
        
        // Process and display grades (same logic as before)
        const classGroups = {};
        
        grades.forEach(grade => {
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
                    examBreakdown: {}
                };
            }
            
            const examType = exam.exam_type || 'N/A';
            const examTypePercentage = getExamTypePercentage(examType);
            
            let finalPercentage = grade.percentage;
            if (grade.written_score !== null && grade.objective_score !== null) {
                const totalScore = (grade.objective_score || 0) + (grade.written_score || 0);
                finalPercentage = (totalScore / exam.total_marks) * 100;
            }
            
            const scaledScore = grade.scaled_score || (finalPercentage ? (finalPercentage * examTypePercentage / 100) : 0);
            
            classGroups[classId][studentId].exams.push(grade);
            classGroups[classId][studentId].totalScaledScore += scaledScore;
            
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

/**
 * Debounced search function for student filter
 */
function setupDebouncedSearch() {
    const studentFilter = document.getElementById('filterStudent');
    if (studentFilter) {
        studentFilter.addEventListener('input', (e) => {
            window.PerformanceOptimizer.debounce('student_search', () => {
                loadResultsOptimized();
            }, 500); // 500ms debounce
        });
    }
}

/**
 * Optimized auto-refresh with longer intervals during peak hours
 */
function setupOptimizedAutoRefresh() {
    // Check time to adjust refresh rate
    const hour = new Date().getHours();
    const isPeakHours = (hour >= 8 && hour <= 17); // 8 AM to 5 PM
    
    // Longer intervals during peak hours
    const resultsInterval = isPeakHours ? 60000 : 30000; // 60s vs 30s
    const analyticsInterval = isPeakHours ? 120000 : 60000; // 120s vs 60s
    
    // Clear existing intervals
    if (window.resultsRefreshInterval) {
        clearInterval(window.resultsRefreshInterval);
    }
    if (window.analyticsRefreshInterval) {
        clearInterval(window.analyticsRefreshInterval);
    }
    
    // Set new intervals
    window.resultsRefreshInterval = setInterval(() => {
        loadResultsOptimized();
        loadFinalGradesOptimized();
        loadStatistics();
    }, resultsInterval);
    
    window.analyticsRefreshInterval = setInterval(() => {
        loadAnalytics();
    }, analyticsInterval);
    
    console.log(`Auto-refresh intervals set: Results=${resultsInterval/1000}s, Analytics=${analyticsInterval/1000}s`);
}
