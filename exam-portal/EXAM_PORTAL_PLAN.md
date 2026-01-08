# Exam Portal - Implementation Plan

## Architecture Decision: **Option A - Separate Folder**

**Why?**
- Better organization and maintainability
- Can be developed independently
- Easier to update without affecting LMS
- Cleaner code structure
- Can share CSS/JS from main LMS or have separate files

## Database Structure (Supabase)

### New Tables Needed:

1. **`exams`** table:
   - `id` (UUID, primary key)
   - `lecturer_id` (UUID, foreign key to users)
   - `title` (text)
   - `description` (text)
   - `subject` (text) - links to subject name
   - `class_id` (text) - which class this exam is for
   - `duration_minutes` (integer) - total exam time
   - `total_marks` (integer) - total possible score
   - `passing_score` (integer, optional)
   - `is_active` (boolean) - whether exam is available
   - `start_date` (timestamp, optional)
   - `end_date` (timestamp, optional)
   - `results_released` (boolean) - whether lecturer has released results
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **`questions`** table:
   - `id` (UUID, primary key)
   - `exam_id` (UUID, foreign key to exams)
   - `question_text` (text)
   - `question_type` (text) - 'multiple_choice', 'true_false', 'short_answer', 'essay'
   - `options` (JSONB) - for multiple choice: `["option1", "option2", "option3", "option4"]`
   - `correct_answer` (text) - the correct answer
   - `marks` (integer) - points for this question
   - `sequence_order` (integer) - for ordering (will be randomized for students)
   - `created_at` (timestamp)

3. **`student_exam_attempts`** table:
   - `id` (UUID, primary key)
   - `student_id` (UUID, foreign key to users)
   - `exam_id` (UUID, foreign key to exams)
   - `started_at` (timestamp)
   - `submitted_at` (timestamp, nullable)
   - `time_remaining_seconds` (integer, nullable)
   - `status` (text) - 'in_progress', 'submitted', 'time_expired', 'auto_submitted'
   - `score` (integer, nullable) - calculated score
   - `total_marks` (integer) - total possible marks
   - `percentage` (decimal, nullable) - calculated percentage
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. **`student_responses`** table:
   - `id` (UUID, primary key)
   - `attempt_id` (UUID, foreign key to student_exam_attempts)
   - `question_id` (UUID, foreign key to questions)
   - `student_answer` (text) - the answer student provided
   - `is_correct` (boolean, nullable) - auto-graded result
   - `marks_awarded` (integer) - marks given for this answer
   - `sequence_order` (integer) - order student saw this question
   - `created_at` (timestamp)

5. **`exam_grades`** table (optional - for gradebook):
   - `id` (UUID, primary key)
   - `student_id` (UUID, foreign key to users)
   - `exam_id` (UUID, foreign key to exams)
   - `attempt_id` (UUID, foreign key to student_exam_attempts)
   - `score` (integer)
   - `percentage` (decimal)
   - `grade` (text, optional) - 'A', 'B', 'C', etc.
   - `scaling_percentage` (decimal) - e.g., 5% for first quiz
   - `scaled_score` (decimal) - final scaled score
   - `created_at` (timestamp)

## Features Implementation

### Lecturer Side:
1. Create Exam
   - Set title, description, subject, class
   - Set duration (total minutes)
   - Set start/end dates (optional)
   - Set total marks

2. Add Questions
   - Multiple choice (with 2-4 options)
   - True/False
   - Short answer (text)
   - Essay (long text)
   - Set marks per question

3. Manage Exams
   - View all exams
   - Activate/deactivate exams
   - View student attempts
   - Release results (manual button)

4. View Analytics
   - Number of students who took exam
   - Average scores
   - Pass/fail rates

### Student Side:
1. View Available Exams
   - Only shows exams for registered subjects
   - Shows exam title, duration, total marks
   - Shows if results are released

2. Take Exam
   - Countdown timer (visible)
   - Questions randomized per student
   - One-way navigation (next only, no back)
   - Auto-submit when time expires
   - Can manually submit early

3. View Results (when released)
   - Score only (no correct answers shown)
   - Percentage
   - Total marks / Obtained marks

## Integration with LMS

- Uses same `users` table (students and lecturers)
- Uses same `courses` field in users table (registered subjects)
- Links exams to subjects (same subject names as in LMS)
- Links exams to classes (same class IDs as in LMS)

## File Structure

```
exam-portal/
├── lecturer-exam-dashboard.html
├── student-exam-portal.html
├── css/
│   └── exam-style.css (or link to ../css/style.css)
├── js/
│   ├── exam-config.js (Supabase config - can share with main)
│   ├── exam-helpers.js (Supabase helpers for exams)
│   ├── lecturer-exam.js (lecturer functionality)
│   └── student-exam.js (student functionality)
└── images/
```

## Next Steps

1. Create folder structure ✅
2. Create database tables in Supabase
3. Build lecturer exam dashboard
4. Build student exam portal
5. Implement question randomization
6. Implement timer and auto-submit
7. Implement auto-grading
8. Add result release functionality

