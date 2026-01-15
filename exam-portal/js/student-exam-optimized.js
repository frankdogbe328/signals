// Optimized Exam Portal Functions
// These functions use the performance optimizer for better concurrent access handling

/**
 * Optimized version of loadAvailableExams() with caching
 */
async function loadAvailableExamsOptimized() {
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
        
        // Create cache key based on student ID and class
        const cacheKey = `available_exams_${currentUser.id}_${currentUser.class}`;
        
        // Use optimized query with caching (15 second cache for exams)
        const exams = await window.PerformanceOptimizer.optimizedQuery(
            async () => {
                const { data, error } = await client
                    .from('exams')
                    .select('id, title, description, subject, exam_type, duration_minutes, total_marks, start_date, end_date, is_active, results_released, class_id')
                    .eq('is_active', true)
                    .eq('class_id', currentUser.class)
                    .in('subject', registeredSubjects);
                
                if (error) throw error;
                return data || [];
            },
            cacheKey,
            15000 // 15 second cache - exams can change frequently
        );
        
        // Filter by date - show exams that have started or are available
        const now = new Date();
        const availableExams = exams.filter(exam => {
            if (exam.start_date && new Date(exam.start_date) > now) return false;
            if (exam.end_date && new Date(exam.end_date) < now) return false;
            return true;
        });
        
        // Check which exams student has already taken (with caching)
        const examIds = availableExams.map(e => e.id);
        const attemptsCacheKey = `exam_attempts_${currentUser.id}`;
        
        const attempts = await window.PerformanceOptimizer.optimizedQuery(
            async () => {
                const { data, error } = await client
                    .from('student_exam_attempts')
                    .select('exam_id, status, score, percentage')
                    .eq('student_id', currentUser.id)
                    .in('exam_id', examIds);
                
                if (error) throw error;
                return data || [];
            },
            attemptsCacheKey,
            10000 // 10 second cache for attempts
        );
        
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

/**
 * Optimized version of startExam() with request queuing
 */
async function startExamOptimized(examId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showError('User session expired. Please log in again.', 'Session Expired');
        return;
    }
    
    // Prevent multiple simultaneous exam starts
    if (window.startingExam) {
        showError('Please wait, exam is loading...', 'Please Wait');
        return;
    }
    
    window.startingExam = true;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Queue the exam start request
        await window.PerformanceOptimizer.queueRequest(async () => {
            // Check if student already has an active attempt
            const { data: existingAttempt } = await client
                .from('student_exam_attempts')
                .select('*')
                .eq('student_id', currentUser.id)
                .eq('exam_id', examId)
                .eq('status', 'in_progress')
                .maybeSingle();
            
            if (existingAttempt) {
                window.startingExam = false;
                if (!confirm('You have an unfinished attempt. Do you want to continue?')) {
                    return;
                }
                await loadExamForAttempt(examId, existingAttempt.id);
                return;
            }
            
            // Get exam details (with caching)
            const examCacheKey = `exam_details_${examId}`;
            const exam = await window.PerformanceOptimizer.optimizedQuery(
                async () => {
                    const { data, error } = await client
                        .from('exams')
                        .select('*')
                        .eq('id', examId)
                        .single();
                    
                    if (error) throw error;
                    return data;
                },
                examCacheKey,
                30000 // 30 second cache for exam details
            );
            
            // Authorization checks
            if (!exam || exam.class_id !== currentUser.class) {
                window.startingExam = false;
                showError('You do not have permission to take this exam. This exam is not for your class.', 'Access Denied');
                return;
            }
            
            const registeredSubjects = currentUser.courses || [];
            if (!registeredSubjects.includes(exam.subject)) {
                window.startingExam = false;
                showError('You do not have permission to take this exam. You are not registered for this subject.', 'Access Denied');
                return;
            }
            
            if (!exam.is_active) {
                window.startingExam = false;
                showError('This exam is not currently active.', 'Exam Not Available');
                return;
            }
            
            // Get questions (with caching)
            const questionsCacheKey = `exam_questions_${examId}`;
            const questionsData = await window.PerformanceOptimizer.optimizedQuery(
                async () => {
                    const { data, error } = await client
                        .from('questions')
                        .select('*')
                        .eq('exam_id', examId)
                        .order('sequence_order', { ascending: true });
                    
                    if (error) throw error;
                    return data || [];
                },
                questionsCacheKey,
                60000 // 1 minute cache for questions (they don't change during exam)
            );
            
            if (!questionsData || questionsData.length === 0) {
                window.startingExam = false;
                showError('This exam has no questions yet.', 'No Questions');
                return;
            }
            
            // Continue with exam start logic (same as original)
            // ... rest of the startExam logic
            
            window.startingExam = false;
        }, 'high'); // High priority for user-initiated actions
        
    } catch (error) {
        console.error('Error starting exam:', error);
        window.startingExam = false;
        showError('Failed to start exam. Please try again.', 'Error Starting Exam');
    }
}

/**
 * Optimized loadAllResults() with caching
 */
async function loadAllResultsOptimized() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const cacheKey = `student_results_${currentUser.id}`;
    
    const results = await window.PerformanceOptimizer.optimizedQuery(
        async () => {
            const client = getSupabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // Get all completed attempts for this student
            const { data: attempts, error } = await client
                .from('student_exam_attempts')
                .select(`
                    id,
                    exam_id,
                    status,
                    score,
                    percentage,
                    started_at,
                    submitted_at,
                    exam:exams!student_exam_attempts_exam_id_fkey(
                        id,
                        title,
                        subject,
                        exam_type,
                        total_marks,
                        results_released
                    )
                `)
                .eq('student_id', currentUser.id)
                .in('status', ['submitted', 'auto_submitted', 'time_expired'])
                .order('submitted_at', { ascending: false })
                .limit(100); // Limit to prevent huge queries
            
            if (error) throw error;
            return attempts || [];
        },
        cacheKey,
        30000 // 30 second cache
    );
    
    // Display results (same as original function)
    displayAllResults(results);
}
