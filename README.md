# Signal Training School - Learning Management System

A Learning Management System (LMS) for the Ghana Armed Forces Signal Training School, built with pure HTML, CSS, and JavaScript.

## Features

### Lecturer Portal
- Upload learning materials for specific courses and classes
- Support for multiple material types (PDF, Video, Links, Text)
- View and manage all uploaded materials
- Delete materials when needed

### Officer Portal
- View learning materials assigned to their class
- Track learning progress
- Mark materials as completed
- View progress statistics (total materials, completed, percentage)

## Getting Started

1. Open `index.html` in a web browser
2. Use the demo credentials to login:

### Demo Credentials

**Lecturer:**
- Username: `lecturer1`
- Password: `password123`

**Officer:**
- Username: `officer1`
- Password: `password123`

## System Structure

```
├── index.html                 # Login page
├── lecturer-dashboard.html    # Lecturer portal
├── officer-dashboard.html     # Officer portal
├── css/
│   └── style.css             # All styling
├── js/
│   ├── app.js                # Core app functionality
│   ├── auth.js               # Authentication handling
│   ├── lecturer.js           # Lecturer dashboard logic
│   └── officer.js            # Officer dashboard logic
└── README.md                 # This file
```

## How to Use

### For Lecturers:
1. Login with lecturer credentials
2. Select course (currently Course 1)
3. Select class (Class A, B, or C)
4. Enter material title, type, content/URL, and description
5. Click "Upload Material"
6. Materials will be visible to officers in the selected class

### For Officers:
1. Login with officer credentials
2. View available materials for your class
3. Click "View Material" to access content
4. Mark materials as completed after studying
5. Track your progress in the progress section

## Data Storage

The system currently uses browser **localStorage** to store:
- User accounts
- Learning materials
- Progress tracking

### ⚠️ Important Limitation

**localStorage is browser/device-specific:**
- ✅ Accounts created on Device A work on Device A
- ❌ Accounts created on Device A **DO NOT** work on Device B or Mobile
- Each device has its own separate database

### 🔧 Backend Required for Cross-Device Access

To make accounts work across all devices (laptop, mobile, tablet), you need a **backend server with a shared database**.

See `BACKEND_SETUP.md` for setup options including:
- Firebase (easiest, free)
- Supabase (free alternative)
- Node.js + Express (custom backend)
- PHP backend (if you have web hosting)

**Note:** For single-device use, localStorage works fine. To reset, clear browser localStorage.

## Course Structure

Currently configured with:
- **Course 1** (placeholder course)
- **Classes:** Class A, Class B, Class C

## Material Types

1. **PDF Document** - For document uploads
2. **Video** - For video content
3. **External Link** - For web resources
4. **Text Content** - For written materials

## Future Enhancements

- Exam system integration
- File upload functionality
- More courses
- Advanced progress analytics
- Notifications system

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Edge
- Safari

## Security Note

This is a demo system using localStorage. For production use, implement:
- Backend server with database
- Secure authentication
- File storage system
- Role-based access control

