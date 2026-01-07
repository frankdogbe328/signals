# How to Get Data from Supabase

## Method 1: Supabase Dashboard (Easiest)

### View Data in Tables:
1. Go to https://app.supabase.com
2. Login to your account
3. Select your project: `tmyiphpvyflockpkmtrh`
4. Click **Table Editor** in the left sidebar
5. Click on any table:
   - `users` - See all registered users
   - `materials` - See all uploaded materials
   - `progress` - See all progress tracking

### Export Data:
1. In Table Editor, click on a table
2. Click the **Export** button (top right)
3. Choose format: CSV, JSON, or Excel
4. Download the file

---

## Method 2: SQL Editor (Query Data)

### Run Custom Queries:
1. Go to Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Write SQL queries:

### Example Queries:

#### Get All Users:
```sql
SELECT * FROM users;
```

#### Get All Students:
```sql
SELECT * FROM users WHERE role = 'student';
```

#### Get All Materials:
```sql
SELECT * FROM materials;
```

#### Get Materials for a Specific Class:
```sql
SELECT * FROM materials WHERE class = 'signal-basic-beginner';
```

#### Get User Progress:
```sql
SELECT 
    u.name,
    u.username,
    m.title,
    p.completed,
    p.completed_at
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN materials m ON p.material_id = m.id;
```

#### Count Users by Role:
```sql
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
```

#### Get Recent Materials:
```sql
SELECT * FROM materials 
ORDER BY uploaded_at DESC 
LIMIT 10;
```

5. Click **Run** to execute
6. View results below
7. Click **Export** to download results

---

## Method 3: Using JavaScript (In Your App)

### Already Implemented Functions:

#### Get Users:
```javascript
// In browser console or your code
const users = await getMaterialsFromSupabase({});
console.log(users);
```

#### Get Materials:
```javascript
// Get all materials
const materials = await getMaterialsFromSupabase({});

// Get materials for specific class
const materials = await getMaterialsFromSupabase({ class: 'signal-basic-beginner' });

// Get materials for specific course
const materials = await getMaterialsFromSupabase({ course: 'Voice procedure' });
```

#### Get User Progress:
```javascript
// Get progress for a specific user
const progress = await getUserProgressFromSupabase(userId);
```

---

## Method 4: Supabase REST API (Direct HTTP Requests)

### Using Browser or Postman:

#### Get All Users:
```
GET https://tmyiphpvyflockpkmtrh.supabase.co/rest/v1/users
Headers:
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Get Materials:
```
GET https://tmyiphpvyflockpkmtrh.supabase.co/rest/v1/materials
Headers:
  apikey: [your anon key]
  Authorization: Bearer [your anon key]
```

#### Filter Materials:
```
GET https://tmyiphpvyflockpkmtrh.supabase.co/rest/v1/materials?class=eq.signal-basic-beginner
Headers:
  apikey: [your anon key]
  Authorization: Bearer [your anon key]
```

---

## Method 5: Export All Data (Backup)

### Export Entire Database:
1. Go to Supabase Dashboard
2. Click **Settings** (gear icon)
3. Click **Database**
4. Scroll to **Connection string**
5. Use a PostgreSQL client (like pgAdmin) to connect
6. Export entire database

### Or Use Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Export data
supabase db dump -f backup.sql
```

---

## Quick Access Links:

- **Dashboard**: https://app.supabase.com/project/tmyiphpvyflockpkmtrh
- **Table Editor**: https://app.supabase.com/project/tmyiphpvyflockpkmtrh/editor
- **SQL Editor**: https://app.supabase.com/project/tmyiphpvyflockpkmtrh/sql
- **API Docs**: https://app.supabase.com/project/tmyiphpvyflockpkmtrh/api

---

## Common Use Cases:

### 1. Check if a user exists:
```sql
SELECT * FROM users WHERE username = 'Doggy';
```

### 2. See all materials uploaded by a lecturer:
```sql
SELECT * FROM materials WHERE uploaded_by = 'Lecturer Name';
```

### 3. See which officers completed which materials:
```sql
SELECT 
    u.name as officer_name,
    m.title as material_title,
    p.completed_at
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN materials m ON p.material_id = m.id
WHERE p.completed = true;
```

### 4. Count materials per course:
```sql
SELECT course, COUNT(*) as count 
FROM materials 
GROUP BY course 
ORDER BY count DESC;
```

---

## Tips:

✅ **Table Editor** - Best for viewing and editing data manually
✅ **SQL Editor** - Best for custom queries and reports
✅ **Export** - Best for backing up data
✅ **REST API** - Best for programmatic access

**The easiest way is using the Supabase Dashboard Table Editor!**

