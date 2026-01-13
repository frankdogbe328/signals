# Excel Question Upload Format Guide

## 📋 Simple Format for Lecturers

### Step 1: Open Excel
Create a new Excel file (.xlsx) with these exact column headers in Row 1:

| Question | Type | Option A | Option B | Option C | Option D | Correct Answer | Marks |
|----------|------|----------|----------|----------|----------|----------------|-------|

### Step 2: Fill in Your Questions

#### Example 1: Multiple Choice Question
```
Question: What is the capital of Ghana?
Type: multiple_choice
Option A: Kumasi
Option B: Accra
Option C: Tamale
Option D: Takoradi
Correct Answer: B
Marks: 1
```

#### Example 2: True/False Question
```
Question: Ghana is located in West Africa.
Type: true_false
Option A: - (leave blank or use dash)
Option B: - (leave blank or use dash)
Option C: - (leave blank or use dash)
Option D: - (leave blank or use dash)
Correct Answer: True
Marks: 1
```

#### Example 3: Short Answer Question
```
Question: What is your name?
Type: short_answer
Option A: - (leave blank)
Option B: - (leave blank)
Option C: - (leave blank)
Option D: - (leave blank)
Correct Answer: Any valid name
Marks: 2
```

#### Example 4: Essay Question
```
Question: Explain the importance of communication in the military.
Type: essay
Option A: - (leave blank)
Option B: - (leave blank)
Option C: - (leave blank)
Option D: - (leave blank)
Correct Answer: Communication is vital for coordination and safety in military operations.
Marks: 5
```

## ✅ Important Rules

### Question Types (Type Column)
- **multiple_choice** - Use this when you have options A, B, C, D
- **true_false** - Use this for True/False questions
- **short_answer** - Use this for short text answers
- **essay** - Use this for long written answers

### Correct Answer Column
- **For Multiple Choice:** 
  - Use letter: **A**, **B**, **C**, or **D**
  - OR use the full option text: **"Accra"** (must match exactly)
  
- **For True/False:** 
  - Use: **True** or **False**
  
- **For Short Answer/Essay:** 
  - Enter the expected answer or key points

### Options Column
- **For Multiple Choice:** Fill Option A, B, C, D with your choices
- **For Other Types:** Leave blank or use **-** (dash)

### Marks Column
- Enter the points for each question (1, 2, 3, 5, 10, etc.)
- Default is 1 if left blank

## 🎯 Complete Example Excel File

| Question | Type | Option A | Option B | Option C | Option D | Correct Answer | Marks |
|----------|------|----------|----------|----------|----------|----------------|-------|
| What is the capital of Ghana? | multiple_choice | Kumasi | Accra | Tamale | Takoradi | B | 1 |
| Ghana is in West Africa. | true_false | - | - | - | - | True | 1 |
| What is 2 + 2? | multiple_choice | 3 | 4 | 5 | 6 | B | 1 |
| Explain military communication. | essay | - | - | - | - | Communication is vital for operations. | 5 |
| What is your name? | short_answer | - | - | - | - | Any name | 2 |

## ⚠️ Common Mistakes to Avoid

1. ❌ Don't forget the header row (Question, Type, Option A, etc.)
2. ❌ Don't leave Correct Answer blank
3. ❌ Don't use wrong question type names
4. ❌ Don't forget to fill Option A-D for multiple choice questions
5. ✅ DO use exact spelling: multiple_choice (with underscore)
6. ✅ DO use "True" or "False" (capital T and F)

## 📤 After Creating Your Excel File

1. Save it as .xlsx format (Excel format)
2. Go to your exam in the system
3. Click "📊 Upload Excel Questions"
4. Select your Excel file
5. Click "Process Excel File"
6. **DONE!** All questions with correct answers are automatically set!

## 💡 Tips

- You can copy the template above and paste into Excel
- Make sure column headers match exactly
- Test with 2-3 questions first before uploading many
- If you see errors, check the browser console (F12) for details
