# Admin Portal Setup Guide

## Overview
The Admin Portal provides centralized management of all exam results, allowing administrators to:
- View all exam results by class, student, and lecturer
- Release final results to students
- View final grades summary
- Monitor system statistics

## Setup Instructions

### 1. Create Admin User

Run the SQL script `lms/supabase-admin-support.sql` in your Supabase SQL Editor to create an admin user.

**Default Admin Credentials:**
- **Username:** `admin`
- **Password:** `Admin123!` (⚠️ **CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!**)
- **Email:** `admin@signalschool.mil.gh` (Update this to your admin email)

### 2. Change Admin Password

After first login:
1. Go to admin portal
2. Change password immediately
3. Update email address if needed

### 3. Access Admin Portal

- **URL:** `admin-portal.html`
- **Login:** Use admin credentials
- **Redirect:** Admins are automatically redirected to admin portal after login

## Features

### Result Management
- **View All Results:** See all exam results organized by class, subject, student, and lecturer
- **Filter Results:** Filter by class, subject, or student name
- **Release Results:** Release individual exam results or all results at once
- **Final Grades:** View accumulated final grades by class

### Statistics Dashboard
- Total Students
- Total Exams
- Completed Exams
- Results Released Count

## Lecturer Registration Security

### Secure Lecturer Registration

Lecturer registration is now restricted to authorized personnel only:

1. **Separate Registration Page:** `lecturer-register.html`
2. **Registration Code Required:** Lecturers must enter a registration code
3. **Default Code:** `LECTURER2026` (⚠️ **CHANGE THIS IN PRODUCTION!**)

### To Change Registration Code

Edit `js/lecturer-register.js`:
```javascript
const LECTURER_REGISTRATION_CODE = 'YOUR_SECURE_CODE_HERE';
```

### Access Control

- **Main Registration Page:** Only allows student registration
- **Lecturer Registration:** Requires registration code
- **Admin Portal:** Only accessible to admin users

## Security Notes

1. **Change Default Passwords:** Both admin and lecturer registration codes should be changed
2. **Secure Registration Code:** Use a strong, unique code for lecturer registration
3. **Admin Access:** Limit admin account creation to authorized personnel only
4. **Regular Audits:** Review admin access logs regularly

## Usage

### Releasing Final Results

1. Login to Admin Portal
2. Filter results by class/subject if needed
3. Click "Release" button next to individual exams OR
4. Click "Release All Final Results" to release all pending results
5. Students will immediately see their results in their portal

### Viewing Final Grades

Final grades are automatically calculated based on:
- All exam scores
- Exam type percentages (if configured)
- Scaled scores

Final grades are displayed by class in the "Final Grades Summary" section.

## Troubleshooting

### Admin Cannot Login
- Verify admin user exists in database
- Check password hash is correct
- Ensure role is set to 'admin'

### Results Not Showing
- Verify exams have been completed
- Check that exam_grades table has records
- Ensure proper relationships between tables

### Cannot Release Results
- Check database permissions
- Verify exam records exist
- Check browser console for errors

## Support

For issues or questions, contact the system administrator.
