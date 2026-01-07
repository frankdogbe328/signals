# Supabase Helper Functions Reference

This document lists all available Supabase helper functions for **Users**, **Materials**, and **Progress** operations.

## Table of Contents
1. [User Functions](#user-functions)
2. [Material Functions](#material-functions)
3. [Progress Functions](#progress-functions)
4. [Storage Functions](#storage-functions)

---

## User Functions

### 1. `getUserFromSupabase(username, password, role)`
**Purpose:** Authenticate and get a user by username, password, and role.

**Parameters:**
- `username` (string): The user's username
- `password` (string): The user's password
- `role` (string): Either `'lecturer'` or `'student'`

**Returns:** User object or `null` if not found

**Example:**
```javascript
const user = await getUserFromSupabase('john_doe', 'password123', 'student');
if (user) {
    console.log('User found:', user.name);
}
```

---

### 2. `getUserByEmailFromSupabase(email, role)`
**Purpose:** Get a user by email and role (used for password reset).

**Parameters:**
- `email` (string): The user's email address
- `role` (string): Either `'lecturer'` or `'student'`

**Returns:** User object or `null` if not found

**Example:**
```javascript
const user = await getUserByEmailFromSupabase('john@example.com', 'student');
if (user) {
    console.log('User found:', user.username);
}
```

---

### 3. `createUserInSupabase(userData)`
**Purpose:** Create a new user in the database.

**Parameters:**
- `userData` (object): User data with the following fields:
  - `username` (string): Unique username
  - `password` (string): User's password
  - `role` (string): `'lecturer'` or `'student'`
  - `name` (string): Full name
  - `class` (string, optional): Class name (for students)
  - `courses` (array, optional): Array of course names
  - `email` (string, optional): Email address

**Returns:** Created user object or throws error

**Example:**
```javascript
try {
    const newUser = await createUserInSupabase({
        username: 'john_doe',
        password: 'password123',
        role: 'student',
        name: 'John Doe',
        class: 'signal-basic-beginner',
        courses: [],
        email: 'john@example.com'
    });
    console.log('User created:', newUser.id);
} catch (error) {
    console.error('Error creating user:', error.message);
}
```

---

### 4. `updateUserInSupabase(userId, updates)`
**Purpose:** Update an existing user's information.

**Parameters:**
- `userId` (string): User's UUID
- `updates` (object): Fields to update (e.g., `{ courses: [...] }`, `{ password: 'newpass' }`)

**Returns:** Updated user object or `null` on error

**Example:**
```javascript
const updated = await updateUserInSupabase(userId, {
    courses: ['Voice procedure', 'Telegraphy procedure']
});
if (updated) {
    console.log('User updated successfully');
}
```

---

### 5. `checkUsernameExists(username)`
**Purpose:** Check if a username is already taken.

**Parameters:**
- `username` (string): Username to check

**Returns:** `true` if exists, `false` if available

**Example:**
```javascript
const exists = await checkUsernameExists('john_doe');
if (exists) {
    console.log('Username already taken');
} else {
    console.log('Username available');
}
```

---

### 6. `getAllUsersFromSupabase()`
**Purpose:** Get all users from the database (used for analytics).

**Parameters:** None

**Returns:** Array of all user objects

**Example:**
```javascript
const allUsers = await getAllUsersFromSupabase();
console.log(`Total users: ${allUsers.length}`);
```

---

## Material Functions

### 1. `getMaterialsFromSupabase(filters = {})`
**Purpose:** Get materials with optional filters (by class, course, category).

**Parameters:**
- `filters` (object, optional): Filter options:
  - `class` (string): Filter by class
  - `course` (string): Filter by course
  - `category` (string): Filter by category

**Returns:** Array of material objects

**Example:**
```javascript
// Get all materials for a specific class and course
const materials = await getMaterialsFromSupabase({
    class: 'signal-basic-beginner',
    course: 'Voice procedure'
});
```

---

### 2. `createMaterialInSupabase(materialData)`
**Purpose:** Create a new learning material.

**Parameters:**
- `materialData` (object): Material data with the following fields:
  - `course` (string): Course name
  - `class` (string): Class name
  - `title` (string): Material title
  - `type` (string): Type (e.g., 'PDF', 'Video', 'Link', 'Text', 'File')
  - `content` (string, optional): Text content or URL
  - `description` (string, optional): Description
  - `category` (string, optional): Category/module
  - `sequence` (number, optional): Display order (default: 999)
  - `uploadedBy` (string): Username of lecturer
  - `isFile` (boolean, optional): Whether it's a file upload
  - `fileName` (string, optional): Original file name
  - `fileType` (string, optional): MIME type (e.g., 'application/pdf')
  - `file_url` (string, optional): URL to file in Supabase Storage

**Returns:** Created material object or `null` on error

**Example:**
```javascript
const material = await createMaterialInSupabase({
    course: 'Voice procedure',
    class: 'signal-basic-beginner',
    title: 'Introduction to Voice Procedure',
    type: 'File',
    description: 'Basic voice procedure guidelines',
    category: 'Module 1',
    sequence: 1,
    uploadedBy: 'lecturer1',
    isFile: true,
    fileName: 'voice_procedure.pdf',
    fileType: 'application/pdf',
    file_url: 'https://...'
});
```

---

### 3. `updateMaterialInSupabase(materialId, materialData)`
**Purpose:** Update an existing material.

**Parameters:**
- `materialId` (string): Material's UUID
- `materialData` (object): Fields to update (same as createMaterialInSupabase)

**Returns:** `true` on success, `false` on error

**Example:**
```javascript
const success = await updateMaterialInSupabase(materialId, {
    title: 'Updated Title',
    description: 'Updated description',
    sequence: 2
});
```

---

### 4. `deleteMaterialFromSupabase(materialId)`
**Purpose:** Delete a material and its associated file (if any) from storage.

**Parameters:**
- `materialId` (string): Material's UUID

**Returns:** `true` on success, `false` on error

**Example:**
```javascript
const deleted = await deleteMaterialFromSupabase(materialId);
if (deleted) {
    console.log('Material deleted successfully');
}
```

---

## Progress Functions

### 1. `getUserProgressFromSupabase(userId)`
**Purpose:** Get a user's completed materials progress.

**Parameters:**
- `userId` (string): User's UUID

**Returns:** Object mapping `material_id` to `true` for completed materials

**Example:**
```javascript
const progress = await getUserProgressFromSupabase(userId);
console.log(`Completed ${Object.keys(progress).length} materials`);
```

---

### 2. `markMaterialCompletedInSupabase(userId, materialId)`
**Purpose:** Mark a material as completed for a user.

**Parameters:**
- `userId` (string): User's UUID
- `materialId` (string): Material's UUID

**Returns:** `true` on success, `false` on error

**Example:**
```javascript
const marked = await markMaterialCompletedInSupabase(userId, materialId);
if (marked) {
    console.log('Material marked as completed');
}
```

---

### 3. `getAllProgressFromSupabase()`
**Purpose:** Get all progress records (for analytics).

**Parameters:** None

**Returns:** Object mapping `user_id` to objects mapping `material_id` to `true`

**Example:**
```javascript
const allProgress = await getAllProgressFromSupabase();
// Use for analytics dashboard
```

---

### 4. `deleteProgressForMaterial(materialId)`
**Purpose:** Delete all progress records for a material (when material is deleted).

**Parameters:**
- `materialId` (string): Material's UUID

**Returns:** `true` on success, `false` on error

**Example:**
```javascript
// Usually called automatically when deleting a material
await deleteProgressForMaterial(materialId);
```

---

## Storage Functions

### 1. `uploadSupabaseFile(file, fileName, folder = 'learning-materials')`
**Purpose:** Upload a file to Supabase Storage.

**Parameters:**
- `file` (File object): The file to upload (from `<input type="file">`)
- `fileName` (string): Original file name
- `folder` (string, optional): Storage bucket folder (default: 'learning-materials')

**Returns:** Object with:
- `path` (string): File path in storage
- `url` (string): Public URL to access the file
- `fileName` (string): Sanitized file name

**Throws:** Error if upload fails

**Example:**
```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

try {
    const result = await uploadSupabaseFile(file, file.name);
    console.log('File uploaded:', result.url);
    // Use result.url as file_url when creating material
} catch (error) {
    console.error('Upload failed:', error.message);
}
```

---

### 2. `getSupabaseFileUrl(filePath, bucket = 'learning-materials')`
**Purpose:** Get the public URL for a file in storage.

**Parameters:**
- `filePath` (string): Path to file in storage
- `bucket` (string, optional): Storage bucket name (default: 'learning-materials')

**Returns:** Public URL string or `null` on error

**Example:**
```javascript
const url = getSupabaseFileUrl('learning-materials/1234567890_document.pdf');
console.log('File URL:', url);
```

---

### 3. `deleteSupabaseFile(bucket = 'learning-materials', filePath)`
**Purpose:** Delete a file from Supabase Storage.

**Parameters:**
- `bucket` (string, optional): Storage bucket name (default: 'learning-materials')
- `filePath` (string): Path to file in storage

**Returns:** `true` on success, `false` on error

**Example:**
```javascript
const deleted = await deleteSupabaseFile('learning-materials', '1234567890_document.pdf');
if (deleted) {
    console.log('File deleted from storage');
}
```

---

## Helper Function

### `getSupabaseClient()`
**Purpose:** Get or initialize the Supabase client (internal use).

**Returns:** Supabase client object or `null` if not available

**Note:** Usually called internally by other functions. You typically don't need to call this directly.

---

## Usage Notes

1. **All functions are async** - Always use `await` or `.then()` when calling them
2. **Error handling** - Most functions return `null` or `false` on error. Check return values before using them
3. **File uploads** - Remember to upload files first, then use the returned URL when creating materials
4. **User IDs** - User IDs are UUIDs generated by Supabase. Store them when users log in
5. **Password reset** - Use `getUserByEmailFromSupabase()` to find users by email for password reset

---

## Common Patterns

### Login Pattern
```javascript
const user = await getUserFromSupabase(username, password, role);
if (user) {
    // Login successful - store user in session
    setCurrentUser(user);
} else {
    // Login failed
    showError('Invalid credentials');
}
```

### Registration Pattern
```javascript
// Check username first
const exists = await checkUsernameExists(username);
if (exists) {
    showError('Username already taken');
    return;
}

// Create user
try {
    const newUser = await createUserInSupabase({
        username, password, role, name, class, email
    });
    // Registration successful
} catch (error) {
    showError('Registration failed: ' + error.message);
}
```

### Upload Material with File Pattern
```javascript
// 1. Upload file to storage
const uploadResult = await uploadSupabaseFile(file, file.name);

// 2. Create material with file URL
const material = await createMaterialInSupabase({
    course, class, title, type: 'File',
    uploadedBy: currentUser.username,
    isFile: true,
    fileName: file.name,
    fileType: file.type,
    file_url: uploadResult.url
});
```

---

## File Location

All these functions are defined in: `js/supabase-helpers.js`

Make sure this file is loaded before any script that uses these functions.

