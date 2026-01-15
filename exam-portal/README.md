# Exam Portal

The Exam and Quiz System for Signal Training School.

## 📁 Structure

```
exam-portal/
├── lecturer-exam-dashboard.html  # Lecturer portal for creating/managing exams
├── student-exam-portal.html      # Student portal for taking exams
├── supabase-exam-tables.sql      # Database tables SQL script
├── EXAM_PORTAL_PLAN.md           # Implementation plan and architecture
├── EXAM_PORTAL_SETUP.md          # Setup and usage guide
├── css/                          # Exam-specific stylesheets
├── js/                           # Exam functionality
│   ├── lecturer-exam.js          # Lecturer exam management
│   └── student-exam.js           # Student exam taking
└── images/                       # Exam-related images
```

## 🚀 Quick Start

### 1. Database Setup
Run `supabase-exam-tables.sql` in your Supabase SQL Editor to create the exam tables.

### 2. Access Portals
- **Lecturer:** `lecturer-exam-dashboard.html`
- **Student:** `student-exam-portal.html`

## ✨ Features

### Lecturer Features
- Create exams with time limits
- Add questions (Multiple Choice, True/False, Short Answer, Essay)
- Manage exams (activate/deactivate)
- View statistics
- Release results manually

### Student Features
- View available exams (for registered subjects)
- Take timed exams with countdown timer
- Randomized questions (different order per student)
- One-way navigation (cannot go back)
- Auto-submit when time expires
- View results (when released by lecturer)

## 📖 Documentation

- **Setup Guide:** See `EXAM_PORTAL_SETUP.md`
- **Architecture:** See `EXAM_PORTAL_PLAN.md`

## 🔗 Integration

The exam portal is integrated with the LMS:
- Uses same student/lecturer accounts
- Links to registered subjects
- Links to classes
- Shares Supabase database

## 🎯 Key Features

- ✅ Time limits with countdown timer
- ✅ Question randomization per student
- ✅ One-way navigation (no going back)
- ✅ Auto-submit when time expires
- ✅ Auto-grading system
- ✅ Manual result release
- ✅ Linked to LMS database
