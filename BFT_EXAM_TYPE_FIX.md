# 🔧 Fix: BFT Exam Type Constraint Error

## ❌ Error Message
```
new row for relation "exams" violates check constraint "exams_exam_type_check"
```

## 🔍 Problem
The database has a CHECK constraint on the `exam_type` column that only allows these values:
- `opening_exam`
- `quiz`
- `bft` (but NOT `bft_1` or `bft_2`)
- `mid_course_exercise`
- `mid_cs_exam`
- `gen_assessment`
- `final_cse_exercise`
- `final_exam`

However, the admin portal code uses `bft_1` and `bft_2` to distinguish between the two BFT tests (each worth 2.5%).

---

## ✅ Solution

### Step 1: Run the Migration Script

1. **Open Supabase Dashboard:**
   - Go to your Supabase project
   - Click on **SQL Editor** (left sidebar)

2. **Open the Migration File:**
   - File: `exam-portal/supabase-exam-migration-add-bft-types.sql`
   - Copy the entire contents

3. **Run in SQL Editor:**
   - Paste the SQL script into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

4. **Verify Success:**
   - You should see a message confirming the constraint was updated
   - The query result should show the new constraint definition

---

## 📋 What the Migration Does

The migration script:
1. ✅ Drops the old constraint (that only allowed `bft`)
2. ✅ Creates a new constraint that allows:
   - `bft` (for backward compatibility)
   - `bft_1` (BFT 1 - 2.5%)
   - `bft_2` (BFT 2 - 2.5%)

---

## 🧪 Testing After Fix

1. **Go to Admin Portal:**
   - Navigate to `/admin-portal.html`
   - Log in as admin

2. **Test BFT Score Entry:**
   - Go to "BFT (Battle Fitness Test) Score Entry"
   - Select a class
   - Select BFT 1 or BFT 2
   - Enter scores for students
   - Click "Save"

3. **Expected Result:**
   - ✅ No error messages
   - ✅ BFT exam record created successfully
   - ✅ Scores saved correctly

---

## 📝 Migration Script Location

```
exam-portal/supabase-exam-migration-add-bft-types.sql
```

---

## 🔄 Alternative: If Migration Fails

If you encounter any errors running the migration:

1. **Check Current Constraint:**
   ```sql
   SELECT 
       conname AS constraint_name,
       pg_get_constraintdef(oid) AS constraint_definition
   FROM pg_constraint
   WHERE conname = 'exams_exam_type_check';
   ```

2. **Manually Update:**
   ```sql
   -- Drop constraint
   ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_exam_type_check;
   
   -- Add new constraint
   ALTER TABLE exams 
   ADD CONSTRAINT exams_exam_type_check CHECK (exam_type IN (
       'opening_exam',
       'quiz',
       'bft',
       'bft_1',
       'bft_2',
       'mid_course_exercise',
       'mid_cs_exam',
       'gen_assessment',
       'final_cse_exercise',
       'final_exam'
   ));
   ```

---

## ✅ After Running Migration

Once the migration is complete:
- ✅ BFT 1 and BFT 2 can be created
- ✅ Each BFT contributes 2.5% to final grade
- ✅ Total BFT contribution: 5% (2 × 2.5%)
- ✅ Admin portal BFT score entry will work

---

**Last Updated:** January 2026
