# Admin Portal - Supabase Integration

## ✅ Confirmed: Admin Portal is Fully Integrated with Supabase

The admin portal interacts with Supabase for **ALL** data operations. Here's a complete breakdown:

## 📊 Data Reading (SELECT Operations)

### 1. **Load All Students**
```javascript
supabase.from('users')
  .select('id, username, name, class, email, created_at')
  .eq('role', 'student')
```
- **Purpose**: Loads all registered students
- **Updates**: Every 30 seconds (auto-refresh)

### 2. **Load Statistics**
```javascript
supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student')
supabase.from('exams').select('id', { count: 'exact' })
supabase.from('student_exam_attempts').select('id', { count: 'exact' })
supabase.from('exams').select('id', { count: 'exact' }).eq('results_released', true)
```
- **Purpose**: Shows total students, exams, completed exams, released results
- **Updates**: Every 30 seconds (auto-refresh)

### 3. **Load Exam Results**
```javascript
supabase.from('exam_grades')
  .select(`
    *,
    student:users!exam_grades_student_id_fkey(...),
    exam:exams!exam_grades_exam_id_fkey(...)
  `)
```
- **Purpose**: Loads all exam grades with student and exam details
- **Includes**: Exam type, lecturer info, scores, percentages

### 4. **Load Final Grades**
```javascript
supabase.from('exam_grades')
  .select(`
    *,
    student:users!exam_grades_student_id_fkey(...),
    exam:exams!exam_grades_exam_id_fkey(...)
  `)
```
- **Purpose**: Calculates final grades by class and student
- **Shows**: Total scaled scores, final grades, exam breakdown

### 5. **Load BFT Students**
```javascript
supabase.from('users')
  .select('id, name, username, class')
  .eq('role', 'student')
  .eq('class', classId)
```
- **Purpose**: Loads students for BFT score entry

### 6. **Check Existing BFT Scores**
```javascript
supabase.from('exam_grades')
  .select('student_id, score, percentage')
  .eq('exam_id', examId)
```
- **Purpose**: Shows existing BFT scores when entering new ones

## ✏️ Data Writing (INSERT Operations)

### 1. **Create BFT Exam Record**
```javascript
supabase.from('exams')
  .insert({
    title: `BFT ${number} - ${className}`,
    exam_type: 'bft_1' or 'bft_2',
    subject: 'BFT (Battle Fitness Test)',
    class_id: classId,
    total_marks: 100,
    ...
  })
```
- **Purpose**: Creates BFT exam records if they don't exist
- **Automatic**: Happens when entering BFT scores

### 2. **Create BFT Attempt Record**
```javascript
supabase.from('student_exam_attempts')
  .insert({
    student_id: studentId,
    exam_id: examId,
    status: 'submitted',
    ...
  })
```
- **Purpose**: Creates attempt record for BFT (required for grade entry)

### 3. **Save BFT Score**
```javascript
supabase.from('exam_grades')
  .insert({
    student_id: studentId,
    exam_id: examId,
    attempt_id: attemptId,
    score: score,
    percentage: percentage,
    grade: grade,
    scaling_percentage: 2.5,
    scaled_score: scaledScore
  })
```
- **Purpose**: Saves BFT scores to database
- **Calculates**: Percentage, grade, scaled score automatically

## 🔄 Data Updating (UPDATE Operations)

### 1. **Release Exam Results**
```javascript
supabase.from('exams')
  .update({ results_released: true })
  .eq('id', examId)
```
- **Purpose**: Releases exam results so students can see them
- **Can do**: Individual exam or all exams at once

### 2. **Update BFT Score**
```javascript
supabase.from('exam_grades')
  .update({
    score: score,
    percentage: percentage,
    grade: grade,
    scaling_percentage: 2.5,
    scaled_score: scaledScore
  })
  .eq('id', gradeId)
```
- **Purpose**: Updates existing BFT scores if changed

## 🔍 Data Filtering

The admin portal uses Supabase queries with filters:
- **By Class**: `.eq('class', classId)`
- **By Subject**: `.eq('subject', subject)`
- **By Student**: Client-side filtering by name/username
- **By Role**: `.eq('role', 'student')` or `.eq('role', 'lecturer')`

## 🔄 Real-Time Updates

- **Auto-refresh**: Every 30 seconds
- **On Actions**: Refreshes after saving BFT scores, releasing results
- **On Filters**: Refreshes when filters change

## 📋 Tables Used

1. **users** - Student and lecturer information
2. **exams** - Exam details, types, release status
3. **exam_grades** - All exam scores and grades
4. **student_exam_attempts** - Exam attempt records

## ✅ Verification

All operations:
- ✅ Use `getSupabaseClient()` to get Supabase connection
- ✅ Check for connection errors
- ✅ Handle errors gracefully
- ✅ Show success/error messages to admin
- ✅ Update UI after operations

## 🎯 Summary

**YES**, the admin portal is **fully integrated** with Supabase:
- ✅ Reads all data from Supabase
- ✅ Writes new data to Supabase
- ✅ Updates existing data in Supabase
- ✅ Auto-refreshes every 30 seconds
- ✅ All operations are real-time

No data is stored locally - everything goes through Supabase!
