# Exam Portal Setup Guide

## ✅ What's Been Built

The exam portal is now ready! Here's what has been created:

### Files Created:
1. **`supabase-exam-tables.sql`** - Database tables SQL script
2. **`exam-portal/lecturer-exam-dashboard.html`** - Lecturer portal for creating/managing exams
3. **`exam-portal/student-exam-portal.html`** - Student portal for taking exams
4. **`exam-portal/js/lecturer-exam.js`** - Lecturer functionality
5. **`exam-portal/js/student-exam.js`** - Student functionality with timer, randomization, auto-grading

### Features Implemented:
✅ Exam creation by lecturers  
✅ Multiple question types (Multiple Choice, True/False, Short Answer, Essay)  
✅ Time limits with countdown timer  
✅ One-way navigation (no going back)  
✅ Question randomization per student  
✅ Auto-submit when time expires  
✅ Auto-grading system  
✅ Manual result release by lecturers  
✅ Linked to LMS (uses same students, subjects, classes)  

## 📋 Setup Steps

### Step 1: Create Database Tables

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-exam-tables.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify tables were created:
   - `exams`
   - `questions`
   - `student_exam_attempts`
   - `student_responses`
   - `exam_grades`

### Step 2: Access the Exam Portal

#### For Lecturers:
- URL: `exam-portal/lecturer-exam-dashboard.html`
- Or add a link in the main lecturer dashboard

#### For Students:
- URL: `exam-portal/student-exam-portal.html`
- Or add a link in the main student dashboard

### Step 3: Add Navigation Links (Optional)

You can add links to the exam portal from the main dashboards:

**In `lecturer-dashboard.html`:**
```html
<a href="exam-portal/lecturer-exam-dashboard.html" class="btn btn-primary">Exam Portal</a>
```

**In `student-dashboard.html`:**
```html
<a href="exam-portal/student-exam-portal.html" class="btn btn-primary">Take Exams</a>
```

## 🎯 How to Use

### For Lecturers:

1. **Create an Exam:**
   - Fill in exam details (title, subject, class, duration, marks)
   - Click "Create Exam"
   - Add questions using the "Add Question" button
   - Questions can be Multiple Choice, True/False, Short Answer, or Essay

2. **Manage Exams:**
   - View all your exams
   - Activate/Deactivate exams
   - View statistics (number of submissions, average scores)
   - Release results when ready

3. **Add Questions:**
   - Click "Manage" on an exam
   - Click "Add Question"
   - Select question type
   - Enter question text, options (if multiple choice), correct answer, and marks

### For Students:

1. **View Available Exams:**
   - Only shows exams for your registered subjects
   - Shows exam details (duration, total marks)
   - Shows if you've already taken the exam

2. **Take Exam:**
   - Click "Start Exam"
   - Timer starts automatically
   - Questions are randomized (different order for each student)
   - Answer questions (can't go back to previous questions)
   - Submit when done or wait for auto-submit when time expires

3. **View Results:**
   - Only available after lecturer releases results
   - Shows score, total marks, and percentage
   - No correct answers shown (score only)

## 🔧 Technical Details

### Database Structure:
- **exams**: Stores exam metadata
- **questions**: Stores all questions for each exam
- **student_exam_attempts**: Tracks exam attempts
- **student_responses**: Stores individual answers
- **exam_grades**: Stores final grades

### Key Features:
- **Question Randomization**: Each student sees questions in different order
- **Timer**: Countdown timer with auto-submit at 0
- **One-way Navigation**: Students cannot go back to previous questions
- **Auto-grading**: Automatically grades Multiple Choice and True/False
- **Manual Release**: Lecturers control when results are visible

## 🐛 Known Limitations / Future Enhancements

1. **Question Editing**: Currently uses prompts - can be enhanced with a proper form modal
2. **Essay Grading**: Currently auto-grades exact matches - can be enhanced for manual grading
3. **Question Deletion**: Placeholder function - needs implementation
4. **Scaling System**: Database supports it but UI not yet implemented
5. **Gradebook View**: Can be added to show all exam grades

## 📝 Notes

- The exam portal uses the same authentication as the LMS
- Students must be registered for subjects to see exams
- Exams are linked to specific classes and subjects
- All data is stored in Supabase (same database as LMS)
- Timer persists in database (can resume if page refreshes)

## 🚀 Next Steps

1. Run the SQL script in Supabase
2. Test creating an exam as a lecturer
3. Test taking an exam as a student
4. Add navigation links to main dashboards (optional)
5. Enhance question creation UI (optional)
6. Add gradebook view (optional)

## ❓ Troubleshooting

**Issue: Tables not created**
- Make sure you're running the SQL in Supabase SQL Editor
- Check for any error messages
- Verify you have proper permissions

**Issue: Can't see exams**
- Make sure student is registered for subjects in LMS
- Check that exam is active and dates are valid
- Verify exam is for the correct class

**Issue: Timer not working**
- Check browser console for errors
- Make sure JavaScript files are loading correctly
- Verify Supabase connection

**Issue: Answers not saving**
- Check browser console for errors
- Verify Supabase connection
- Check that attempt was created successfully

