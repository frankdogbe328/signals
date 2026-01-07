# How to View Users Organized by Role in Supabase

## Method 1: Using Table Editor (Easiest)

### **Sort by Role:**
1. Go to Supabase Dashboard
2. Click **Table Editor** → **users** table
3. Click the **"role"** column header
4. Click again to toggle ascending/descending
5. Users will be sorted by role

### **Filter by Role:**
1. In Table Editor → **users** table
2. Click the **filter icon** (funnel icon) at the top
3. Select **"role"** column
4. Choose filter:
   - **Equals** → `lecturer` (to see only lecturers)
   - **Equals** → `student` (to see only students)
5. Click **Apply**

## Method 2: Using SQL Editor (More Control)

### **View All Users Sorted by Role:**
1. Go to **SQL Editor**
2. Run this query:

```sql
SELECT * FROM users
ORDER BY 
    CASE role 
        WHEN 'lecturer' THEN 1 
        WHEN 'student' THEN 2 
    END,
    name ASC;
```

### **View Only Lecturers:**
```sql
SELECT * FROM users
WHERE role = 'lecturer'
ORDER BY name ASC;
```

### **View Only Students:**
```sql
SELECT * FROM users
WHERE role = 'student'
ORDER BY class, name ASC;
```

### **Count Users by Role:**
```sql
SELECT 
    role,
    COUNT(*) as total_users
FROM users
GROUP BY role;
```

## Method 3: Create a View (Best for Repeated Use)

### **Create the View:**
1. Go to **SQL Editor**
2. Run this SQL (from `supabase-organize-by-role.sql`):

```sql
CREATE OR REPLACE VIEW users_by_role AS
SELECT * FROM users
ORDER BY 
    CASE role 
        WHEN 'lecturer' THEN 1 
        WHEN 'student' THEN 2 
    END,
    name ASC;
```

### **Use the View:**
1. Go to **Table Editor**
2. You'll see **"users_by_role"** in the table list
3. Click it to see users already sorted by role!

## Quick Tips:

✅ **Table Editor** - Best for quick viewing and filtering
✅ **SQL Editor** - Best for custom queries and reports
✅ **Views** - Best for repeated access to organized data

## Recommended Setup:

1. **Run the SQL** from `supabase-organize-by-role.sql`
2. **Create the view** (Method 3)
3. **Use the view** in Table Editor for easy access

**Now you can easily see users organized by role!** 🎯

