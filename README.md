# Ghana Armed Forces Signals Training School - Learning Management System

A comprehensive Learning Management System (LMS) and Exam Portal for the Ghana Armed Forces Signals Training School.

## 📁 Project Structure

```
system fot military/
├── 📚 LMS Portal/              # Learning Management System
│   ├── index.html              # Login/Registration page
│   ├── lecturer-dashboard.html  # Lecturer portal
│   ├── student-dashboard.html   # Student portal
│   ├── css/                    # Stylesheets
│   ├── js/                     # JavaScript files
│   ├── images/                 # Images and assets
│   └── lms/                    # LMS database SQL scripts
│
├── 📝 Exam Portal/              # Exam and Quiz System
│   ├── lecturer-exam-dashboard.html
│   ├── student-exam-portal.html
│   ├── js/                     # Exam JavaScript files
│   ├── css/                    # Exam stylesheets
│   ├── images/                 # Exam images
│   └── supabase-exam-tables.sql # Exam database tables
│
└── 📖 Documentation/           # Setup and reference docs
    └── docs/                   # Documentation files
```

## 🚀 Features

### LMS Portal
- **Lecturer Features:**
  - Upload learning materials (PDFs, Word docs, images, PowerPoint, text)
  - Organize materials by subject, class, and category
  - Track student progress and completion rates
  - View analytics dashboard
  - Register for subjects they teach

- **Student Features:**
  - Register for subjects
  - View and download learning materials
  - Track learning progress
  - Mark materials as completed

### Exam Portal
- **Lecturer Features:**
  - Create exams and quizzes
  - Add questions (Multiple Choice, True/False, Short Answer, Essay)
  - Set time limits
  - View statistics
  - Release results manually

- **Student Features:**
  - Take timed exams
  - Randomized questions (different order per student)
  - One-way navigation (cannot go back)
  - Auto-submit when time expires
  - View results (when released)

## 🛠️ Setup

### Prerequisites
- Supabase account (free tier available)
- Web server (or use Vercel/Netlify for hosting)

### Initial Setup

1. **Set up Supabase Database:**
   - Go to `lms/supabase-database-setup.sql` and run in Supabase SQL Editor
   - Go to `lms/supabase-storage-setup.sql` and run for file uploads
   - Go to `exam-portal/supabase-exam-tables.sql` and run for exam system

2. **Configure Supabase:**
   - Update `js/supabase-config.js` with your Supabase URL and keys

3. **Deploy:**
   - Upload files to your web server
   - Or deploy to Vercel/Netlify

## 📖 Documentation

- **LMS Setup:** See `docs/` folder for detailed setup instructions
- **Exam Portal Setup:** See `exam-portal/EXAM_PORTAL_SETUP.md`
- **Database Scripts:** See `lms/` folder for all SQL scripts

## 🔗 Quick Links

- **LMS Login:** `index.html`
- **Lecturer Dashboard:** `lecturer-dashboard.html`
- **Student Dashboard:** `student-dashboard.html`
- **Lecturer Exam Portal:** `exam-portal/lecturer-exam-dashboard.html`
- **Student Exam Portal:** `exam-portal/student-exam-portal.html`

## 👨‍💻 Developer

Developed and Powered by **Frank Kojo Dogbe** | Co-developed by Solomon A. Nortey

## 📝 License

© 2026 Ghana Armed Forces Signals Training School. All rights reserved.
