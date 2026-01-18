// Student Progress Tracking Dashboard
// Shows comprehensive progress metrics for students

let studentProgressData = {
    exams: [],
    overallStats: null
};

// Initialize progress dashboard
async function initializeStudentProgressDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        console.error('Progress dashboard requires student role');
        return;
    }
    
    await loadStudentProgressData();
    displayProgressDashboard();
}

// Load all progress data for student
async function loadStudentProgressData() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Get all exam attempts
        const { data: attempts, error: attemptsError } = await client
            .from('student_exam_attempts')
            .select(`
                *,
                exams (
                    id,
                    title,
                    subject,
                    class_id,
                    total_marks,
                    duration_minutes,
                    created_at
                )
            `)
            .eq('student_id', currentUser.id)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('submitted_at', { ascending: false });
        
        if (attemptsError) throw attemptsError;
        
        // Get all available exams for this student's class
        const { data: allExams, error: examsError } = await client
            .from('exams')
            .select('*')
            .eq('is_active', true)
            .eq('class_id', currentUser.class)
            .in('subject', currentUser.courses || []);
        
        if (examsError) throw examsError;
        
        // Calculate statistics
        studentProgressData.exams = (attempts || []).map(attempt => ({
            exam: attempt.exams,
            attempt: {
                id: attempt.id,
                score: attempt.score || 0,
                total_marks: attempt.total_marks || attempt.exams?.total_marks || 0,
                percentage: attempt.percentage || 0,
                submitted_at: attempt.submitted_at,
                status: attempt.status
            }
        }));
        
        // Calculate overall statistics
        calculateOverallStats(studentProgressData.exams, allExams || []);
        
    } catch (error) {
        console.error('Error loading student progress:', error);
        if (typeof ErrorMonitoring !== 'undefined') {
            ErrorMonitoring.captureException(error, {
                tags: { context: 'loadStudentProgressData' }
            });
        }
    }
}

// Calculate overall statistics
function calculateOverallStats(completedExams, allExams) {
    const totalExams = allExams.length;
    const completedCount = completedExams.length;
    const pendingCount = totalExams - completedCount;
    
    let totalScore = 0;
    let totalPossibleMarks = 0;
    let averagePercentage = 0;
    
    completedExams.forEach(item => {
        totalScore += item.attempt.score || 0;
        totalPossibleMarks += item.attempt.total_marks || 0;
    });
    
    if (completedExams.length > 0) {
        averagePercentage = completedExams.reduce((sum, item) => sum + (item.attempt.percentage || 0), 0) / completedExams.length;
    }
    
    // Grade distribution
    const gradeDistribution = {
        A: 0, // 90-100%
        B: 0, // 80-89%
        C: 0, // 70-79%
        D: 0, // 60-69%
        F: 0  // <60%
    };
    
    completedExams.forEach(item => {
        const percentage = item.attempt.percentage || 0;
        if (percentage >= 90) gradeDistribution.A++;
        else if (percentage >= 80) gradeDistribution.B++;
        else if (percentage >= 70) gradeDistribution['C+']++;
        else if (percentage >= 60) gradeDistribution.C++;
        else if (percentage >= 50) gradeDistribution['C-']++;
        else if (percentage >= 60) gradeDistribution.D++;
        else gradeDistribution.F++;
    });
    
    // Subject-wise breakdown
    const subjectStats = {};
    completedExams.forEach(item => {
        const subject = item.exam?.subject || 'Unknown';
        if (!subjectStats[subject]) {
            subjectStats[subject] = {
                count: 0,
                totalScore: 0,
                totalMarks: 0,
                averagePercentage: 0
            };
        }
        subjectStats[subject].count++;
        subjectStats[subject].totalScore += item.attempt.score || 0;
        subjectStats[subject].totalMarks += item.attempt.total_marks || 0;
    });
    
    // Calculate averages per subject
    Object.keys(subjectStats).forEach(subject => {
        const stats = subjectStats[subject];
        if (stats.count > 0) {
            stats.averagePercentage = (stats.totalScore / stats.totalMarks) * 100;
        }
    });
    
    studentProgressData.overallStats = {
        totalExams,
        completedCount,
        pendingCount,
        completionRate: totalExams > 0 ? (completedCount / totalExams) * 100 : 0,
        averagePercentage: averagePercentage.toFixed(1),
        totalScore,
        totalPossibleMarks,
        overallPercentage: totalPossibleMarks > 0 ? ((totalScore / totalPossibleMarks) * 100).toFixed(1) : 0,
        gradeDistribution,
        subjectStats
    };
}

// Display progress dashboard
function displayProgressDashboard() {
    const dashboardContainer = document.getElementById('progressDashboard');
    if (!dashboardContainer) return;
    
    const stats = studentProgressData.overallStats;
    if (!stats) {
        dashboardContainer.innerHTML = '<p>Loading progress data...</p>';
        return;
    }
    
    const html = `
        <div class="progress-dashboard">
            <!-- Overall Statistics Cards -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${stats.completedCount}/${stats.totalExams}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Exams Completed</div>
                </div>
                
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${stats.averagePercentage}%</div>
                    <div style="font-size: 14px; opacity: 0.9;">Average Score</div>
                </div>
                
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${stats.completionRate.toFixed(0)}%</div>
                    <div style="font-size: 14px; opacity: 0.9;">Completion Rate</div>
                </div>
                
                <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${stats.pendingCount}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Pending Exams</div>
                </div>
            </div>
            
            <!-- Grade Distribution -->
            <div class="grade-distribution" style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: var(--primary-color);">Grade Distribution</h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    ${Object.entries(stats.gradeDistribution).map(([grade, count]) => `
                        <div style="flex: 1; min-width: 120px; text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: ${getGradeColor(grade)};">${grade}</div>
                            <div style="font-size: 18px; margin-top: 5px;">${count}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">exam${count !== 1 ? 's' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Subject-wise Performance -->
            <div class="subject-performance" style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: var(--primary-color);">Performance by Subject</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${Object.entries(stats.subjectStats).map(([subject, subjectStat]) => `
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong style="font-size: 16px;">${subject}</strong>
                                <span style="font-size: 18px; font-weight: bold; color: var(--primary-color);">
                                    ${subjectStat.averagePercentage.toFixed(1)}%
                                </span>
                            </div>
                            <div style="font-size: 14px; color: #666;">
                                ${subjectStat.count} exam${subjectStat.count !== 1 ? 's' : ''} completed
                            </div>
                            <div style="margin-top: 10px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${subjectStat.averagePercentage}%; background: linear-gradient(90deg, var(--primary-color), #667eea); transition: width 0.3s;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Recent Exam Results -->
            <div class="recent-exams" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: var(--primary-color);">Recent Exam Results</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Exam</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Subject</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Score</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Percentage</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Grade</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${studentProgressData.exams.slice(0, 10).map(item => {
                                const percentage = item.attempt.percentage || 0;
                                const grade = getGradeFromPercentage(percentage);
                                return `
                                    <tr style="border-bottom: 1px solid #dee2e6;">
                                        <td style="padding: 12px;">${escapeHtml(item.exam?.title || 'Unknown')}</td>
                                        <td style="padding: 12px;">${escapeHtml(item.exam?.subject || 'Unknown')}</td>
                                        <td style="padding: 12px; text-align: center;">
                                            <strong>${item.attempt.score || 0}</strong> / ${item.attempt.total_marks || 0}
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            <strong style="color: ${getGradeColor(grade)};">${percentage.toFixed(1)}%</strong>
                                        </td>
                                        <td style="padding: 12px; text-align: center;">
                                            <span style="display: inline-block; padding: 4px 12px; background: ${getGradeColor(grade)}; color: white; border-radius: 4px; font-weight: bold;">
                                                ${grade}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; color: #666;">
                                            ${item.attempt.submitted_at ? new Date(item.attempt.submitted_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    dashboardContainer.innerHTML = html;
}

// Helper function to get grade from percentage (Signal Training School grading system)
function getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 40) return 'D';
    return 'F';
}

// Helper function to get color for grade
function getGradeColor(grade) {
    const colors = {
        'A': '#28a745',
        'B': '#17a2b8',
        'C+': '#20c997',
        'C': '#ffc107',
        'C-': '#fd7e14',
        'D': '#fd7e14',
        'F': '#dc3545'
    };
    return colors[grade] || '#666';
}

// Helper function to escape HTML (use SecurityUtils if available)
function escapeHtml(text) {
    if (typeof SecurityUtils !== 'undefined' && SecurityUtils.escapeHtml) {
        return SecurityUtils.escapeHtml(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for use in student dashboard
if (typeof window !== 'undefined') {
    window.initializeStudentProgressDashboard = initializeStudentProgressDashboard;
    window.loadStudentProgressData = loadStudentProgressData;
    window.displayProgressDashboard = displayProgressDashboard;
}
