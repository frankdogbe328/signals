// Export Exam Results to PDF/Excel
// Uses libraries: jsPDF for PDF, SheetJS (xlsx) for Excel

/**
 * Export exam results to PDF
 */
async function exportResultsToPDF(examId, examTitle = 'Exam Results') {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('Only lecturers can export results.', 'Authorization Required');
            return;
        }
        
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            // Load jsPDF from CDN
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        const { jsPDF } = window.jspdf || window;
        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }
        
        // Get exam and results data
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Verify exam ownership
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError || !exam || exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to export results for this exam.', 'Access Denied');
            return;
        }
        
        // Get all attempts for this exam
        const { data: attempts, error: attemptsError } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('score', { ascending: false });
        
        if (attemptsError) throw attemptsError;
        
        // Get user details for each attempt (separate query for compatibility)
        if (attempts && attempts.length > 0) {
            const userIds = [...new Set(attempts.map(a => a.student_id))];
            const { data: users, error: usersError } = await client
                .from('users')
                .select('id, name, username, class')
                .in('id', userIds);
            
            if (!usersError && users) {
                const userMap = {};
                users.forEach(u => {
                    userMap[u.id] = u;
                });
                
                attempts.forEach(attempt => {
                    attempt.users = userMap[attempt.student_id] || {};
                });
            }
        }
        
        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = margin;
        
        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(examTitle, margin, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Subject: ${exam.subject}`, margin, yPos);
        yPos += 7;
        doc.text(`Class: ${exam.class_id}`, margin, yPos);
        yPos += 7;
        doc.text(`Total Marks: ${exam.total_marks}`, margin, yPos);
        yPos += 7;
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
        yPos += 15;
        
        // Table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const colWidths = [60, 80, 30, 35, 30];
        const headers = ['Student Name', 'Username', 'Score', 'Percentage', 'Grade'];
        let xPos = margin;
        
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
        });
        yPos += 7;
        
        // Draw line
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Table data
        doc.setFont(undefined, 'normal');
        (attempts || []).forEach((attempt, index) => {
            // Check if new page needed
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            
            const student = attempt.users;
            const percentage = attempt.percentage || 0;
            const grade = getGradeFromPercentage(percentage);
            
            xPos = margin;
            doc.text(student.name || 'N/A', xPos, yPos);
            xPos += colWidths[0];
            doc.text(student.username || 'N/A', xPos, yPos);
            xPos += colWidths[1];
            doc.text(`${attempt.score || 0}/${attempt.total_marks || 0}`, xPos, yPos);
            xPos += colWidths[2];
            doc.text(`${percentage.toFixed(1)}%`, xPos, yPos);
            xPos += colWidths[3];
            doc.text(grade, xPos, yPos);
            
            yPos += 7;
        });
        
        // Statistics summary
        if (attempts && attempts.length > 0) {
            yPos += 10;
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFont(undefined, 'bold');
            doc.text('Summary Statistics', margin, yPos);
            yPos += 7;
            doc.setFont(undefined, 'normal');
            
            const totalStudents = attempts.length;
            const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalStudents;
            const avgPercentage = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalStudents;
            const highestScore = Math.max(...attempts.map(a => a.score || 0));
            const lowestScore = Math.min(...attempts.map(a => a.score || 0));
            
            doc.text(`Total Students: ${totalStudents}`, margin, yPos);
            yPos += 7;
            doc.text(`Average Score: ${avgScore.toFixed(1)}/${exam.total_marks}`, margin, yPos);
            yPos += 7;
            doc.text(`Average Percentage: ${avgPercentage.toFixed(1)}%`, margin, yPos);
            yPos += 7;
            doc.text(`Highest Score: ${highestScore}/${exam.total_marks}`, margin, yPos);
            yPos += 7;
            doc.text(`Lowest Score: ${lowestScore}/${exam.total_marks}`, margin, yPos);
        }
        
        // Save PDF
        const fileName = `${examTitle.replace(/[^a-z0-9]/gi, '_')}_Results_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showSuccess('Results exported to PDF successfully!', 'Export Successful');
        
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        if (typeof ErrorMonitoring !== 'undefined') {
            ErrorMonitoring.captureException(error, { tags: { context: 'exportResultsToPDF' } });
        }
        showError('Failed to export results to PDF. Please try again.', 'Export Error');
    }
}

/**
 * Export exam results to Excel
 */
async function exportResultsToExcel(examId, examTitle = 'Exam Results') {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'lecturer') {
            showError('Only lecturers can export results.', 'Authorization Required');
            return;
        }
        
        // Check if XLSX is available
        if (typeof XLSX === 'undefined') {
            // Load SheetJS from CDN
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        }
        
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded');
        }
        
        // Get exam and results data
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        // Verify exam ownership
        const { data: exam, error: examError } = await client
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();
        
        if (examError || !exam || exam.lecturer_id !== currentUser.id) {
            showError('You do not have permission to export results for this exam.', 'Access Denied');
            return;
        }
        
        // Get all attempts for this exam
        const { data: attempts, error: attemptsError } = await client
            .from('student_exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .in('status', ['submitted', 'auto_submitted', 'time_expired'])
            .order('score', { ascending: false });
        
        if (attemptsError) throw attemptsError;
        
        // Get user details for each attempt (separate query for compatibility)
        if (attempts && attempts.length > 0) {
            const userIds = [...new Set(attempts.map(a => a.student_id))];
            const { data: users, error: usersError } = await client
                .from('users')
                .select('id, name, username, class')
                .in('id', userIds);
            
            if (!usersError && users) {
                const userMap = {};
                users.forEach(u => {
                    userMap[u.id] = u;
                });
                
                attempts.forEach(attempt => {
                    attempt.users = userMap[attempt.student_id] || {};
                });
            }
        }
        
        // Prepare data for Excel
        const excelData = [
            // Header row
            ['Student Name', 'Username', 'Class', 'Score', 'Total Marks', 'Percentage', 'Grade', 'Submitted Date', 'Status']
        ];
        
        // Data rows
        (attempts || []).forEach(attempt => {
            const student = attempt.users;
            const percentage = attempt.percentage || 0;
            const grade = getGradeFromPercentage(percentage);
            
            excelData.push([
                student.name || 'N/A',
                student.username || 'N/A',
                student.class || 'N/A',
                attempt.score || 0,
                attempt.total_marks || 0,
                percentage.toFixed(2),
                grade,
                attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A',
                attempt.status || 'N/A'
            ]);
        });
        
        // Add summary statistics
        if (attempts && attempts.length > 0) {
            excelData.push([]); // Empty row
            excelData.push(['Summary Statistics', '', '', '', '', '', '', '', '']);
            excelData.push(['Total Students', attempts.length, '', '', '', '', '', '', '']);
            
            const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length;
            const avgPercentage = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length;
            
            excelData.push(['Average Score', avgScore.toFixed(2), '', '', '', '', '', '', '']);
            excelData.push(['Average Percentage', avgPercentage.toFixed(2) + '%', '', '', '', '', '', '', '']);
        }
        
        // Create workbook and worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, // Student Name
            { wch: 20 }, // Username
            { wch: 15 }, // Class
            { wch: 10 }, // Score
            { wch: 12 }, // Total Marks
            { wch: 12 }, // Percentage
            { wch: 8 },  // Grade
            { wch: 20 }, // Submitted Date
            { wch: 15 }  // Status
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
        
        // Add metadata sheet
        const metaData = [
            ['Exam Title', exam.title],
            ['Subject', exam.subject],
            ['Class', exam.class_id],
            ['Total Marks', exam.total_marks],
            ['Duration (minutes)', exam.duration_minutes],
            ['Generated Date', new Date().toLocaleString()],
            ['Generated By', currentUser.name]
        ];
        const metaWs = XLSX.utils.aoa_to_sheet(metaData);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Exam Info');
        
        // Save file
        const fileName = `${examTitle.replace(/[^a-z0-9]/gi, '_')}_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showSuccess('Results exported to Excel successfully!', 'Export Successful');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        if (typeof ErrorMonitoring !== 'undefined') {
            ErrorMonitoring.captureException(error, { tags: { context: 'exportResultsToExcel' } });
        }
        showError('Failed to export results to Excel. Please try again.', 'Export Error');
    }
}

/**
 * Helper function to load script dynamically
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Helper function to get grade from percentage
 */
function getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

// Export for use in lecturer-exam.js
if (typeof window !== 'undefined') {
    window.exportResultsToPDF = exportResultsToPDF;
    window.exportResultsToExcel = exportResultsToExcel;
}
