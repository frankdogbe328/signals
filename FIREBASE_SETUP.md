# Firebase Setup Guide for Signal Training School LMS

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Enter project name: `signal-training-school-lms`
4. Disable Google Analytics (optional, not needed)
5. Click "Create project"
6. Wait for project to be created

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in left menu
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

## Step 3: Create Firestore Database

1. Click "Firestore Database" in left menu
2. Click "Create database"
3. Select "Start in test mode" (for now)
4. Choose a location (choose closest to Ghana, e.g., `europe-west`)
5. Click "Enable"

## Step 4: Get Firebase Config

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the `</>` (Web) icon
5. Register app name: `Signal Training School LMS`
6. Copy the `firebaseConfig` object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Update Firestore Security Rules

1. Go to Firestore Database → Rules tab
2. Replace with these rules (for now, we'll secure later):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Materials collection - authenticated users can read, lecturers can write
    match /materials/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'lecturer';
    }
    
    // Progress collection - users can read/write their own progress
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 6: Enable Storage (for file uploads)

1. Click "Storage" in left menu
2. Click "Get started"
3. Start in test mode
4. Choose same location as Firestore
5. Click "Done"

## Next Steps

After completing these steps, I'll integrate Firebase into your codebase. The system will:
- Store all accounts in Firebase (works across all devices)
- Store materials in Firebase
- Store progress in Firebase
- Handle authentication through Firebase
- Allow file uploads to Firebase Storage

## Important Notes

- **Free Tier Limits:**
  - 50,000 reads/day
  - 20,000 writes/day
  - 1 GB storage
  - 10 GB/month transfer
  
- **Security:** The test mode rules allow anyone to read/write. We'll secure this properly after setup.

- **Backup:** Firebase automatically backs up your data.

Once you complete these steps, let me know and I'll integrate Firebase into your code!

