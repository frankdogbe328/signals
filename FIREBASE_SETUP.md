# Firebase Setup Guide for Signal Training School LMS

## Step 0: Sign in to Firebase (If you already have an account)

**If you already have a Firebase/Google account:**
1. **Go to:** https://console.firebase.google.com
2. Sign in with your existing Google account
3. You're ready to create a new project!

**If you don't have an account yet:**
1. **Go to:** https://firebase.google.com
2. Click **"Get started"** or **"Go to console"** button (top right)
3. You'll be asked to sign in with a **Google account**
   - If you have Gmail, use that
   - If not, create a Google account first at https://accounts.google.com/signup
4. Once signed in, you'll be taken to the Firebase Console

**Note:** You can have multiple projects in one Firebase account. Each project is separate and isolated. The free tier applies per project.

## Step 1: Create Firebase Project

1. **Go to Firebase Console:** https://console.firebase.google.com
2. Click **"Add project"** or **"Create a project"** button
3. Enter project name: `signal-training-school-lms` (or any name you prefer)
4. Click **"Continue"**
5. **Google Analytics:** Choose "Disable" (not needed for this project)
6. Click **"Create project"**
7. Wait 30-60 seconds for project to be created
8. Click **"Continue"** when ready

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

