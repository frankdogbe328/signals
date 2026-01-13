// Enhanced Word Document Parser for Bulk Question Import
// Improved parsing with better pattern recognition and error handling

// Helper function to parse options (handles both JSON arrays and comma-separated strings)
function parseQuestionOptions(optionsString) {
    if (!optionsString) return [];
    
    try {
        // Try parsing as JSON first
        const parsed = JSON.parse(optionsString);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        // If it's not an array, treat as single value
        return [parsed];
    } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        if (typeof optionsString === 'string') {
            return optionsString.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
        }
        return [];
    }
}

/**
 * Enhanced question parser with multiple format support
 * Supports:
 * - Numbered questions (1., 2., Q1, Question 1)
 * - Multiple formats: A) B) C) or A. B. C. or a) b) c)
 * - True/False questions
 * - Short answer questions
 * - Essay questions
 * - Questions with mark allocations
 */
function parseQuestionsFromTextEnhanced(text) {
    const questions = [];
    
    // Normalize text: Remove extra whitespace, normalize line breaks
    let normalizedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n') // Replace multiple blank lines with double
        .trim();
    
    // Split into potential question blocks (by double line breaks or question markers)
    const blocks = splitIntoQuestionBlocks(normalizedText);
    
    blocks.forEach((block, index) => {
        const question = parseQuestionBlock(block, index + 1);
        if (question && validateQuestion(question)) {
            questions.push(question);
        }
    });
    
    return questions;
}

/**
 * Split text into potential question blocks
 */
function splitIntoQuestionBlocks(text) {
    const blocks = [];
    
    // Pattern 1: Questions separated by double line breaks
    const doubleLineBreakBlocks = text.split(/\n\s*\n/);
    
    // Pattern 2: Questions starting with numbers/Q
    const numberedPattern = /(?:^|\n)(?:(?:Question\s*)?\d+|Q\d+)[\.:]\s*/gim;
    const matches = [...text.matchAll(numberedPattern)];
    
    if (matches.length > 1) {
        // Split by question markers
        for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index;
            const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
            blocks.push(text.substring(start, end).trim());
        }
    } else if (doubleLineBreakBlocks.length > 1) {
        // Use double line break splitting
        blocks.push(...doubleLineBreakBlocks);
    } else {
        // Fallback: treat entire text as one block
        blocks.push(text);
    }
    
    return blocks.filter(block => block.trim().length > 10); // Minimum question length
}

/**
 * Parse a single question block
 */
function parseQuestionBlock(block, questionNumber) {
    const lines = block.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length === 0) return null;
    
    let questionText = '';
    let options = [];
    let correctAnswer = '';
    let marks = 1;
    let questionType = 'multiple_choice';
    
    let currentSection = 'question'; // 'question', 'options', 'answer'
    let collectingOption = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect question text (starts with number or Q)
        if (i === 0 || /^(?:(?:Question\s*)?\d+|Q\d+)[\.:]\s*(.+)$/i.test(line)) {
            const match = line.match(/^(?:(?:Question\s*)?\d+|Q\d+)[\.:]\s*(.+)$/i);
            if (match) {
                questionText = match[1].trim();
            } else {
                questionText = line;
            }
            currentSection = 'question';
            continue;
        }
        
        // Detect marks allocation (e.g., "[5 marks]", "(10 points)", "Marks: 5")
        const marksMatch = line.match(/(?:\[|\(|Marks:?\s*)(\d+)\s*(?:marks?|points?|pts?)(?:\]|\))?/i);
        if (marksMatch) {
            marks = parseInt(marksMatch[1]) || 1;
            continue;
        }
        
        // Detect options (A) B) C) or A. B. C. format)
        const optionMatch = line.match(/^([A-Fa-f])[\)\.]\s*(.+)$/);
        if (optionMatch) {
            const letter = optionMatch[1].toUpperCase();
            const text = optionMatch[2].trim();
            
            if (currentSection === 'question' && options.length === 0) {
                currentSection = 'options';
            }
            
            options.push(text);
            collectingOption = letter;
            continue;
        }
        
        // Detect True/False patterns in question text
        if (questionText && /true\s*\/\s*false|true\s+or\s+false|^true\s*:?\s*false|^false\s*:?\s*true/i.test(questionText)) {
            questionType = 'multiple_choice';
            if (options.length === 0) {
                options.push('True');
                options.push('False');
            }
        }
        
        // Detect answer line that is just True or False
        if (/^(?:Correct\s+)?(?:Answer|Ans|Key|Solution):?\s*(true|false)$/i.test(line)) {
            const tfAnswer = line.match(/(true|false)$/i);
            if (tfAnswer && options.length === 0) {
                questionType = 'multiple_choice';
                options.push('True');
                options.push('False');
                correctAnswer = tfAnswer[0].charAt(0).toUpperCase() + tfAnswer[0].slice(1).toLowerCase();
            }
            continue;
        }
        
        // Detect True/False in standalone line
        if (/^(true|false)\s*:?\s*(true|false)/i.test(line)) {
            questionType = 'multiple_choice';
            const tfMatch = line.match(/(true|false)/gi);
            if (tfMatch && options.length === 0) {
                options.push('True');
                options.push('False');
                correctAnswer = tfMatch[0].charAt(0).toUpperCase() + tfMatch[0].slice(1).toLowerCase();
            }
            continue;
        }
        
        // Detect answer line (Answer:, Correct Answer:, Ans:, Key:)
        const answerMatch = line.match(/^(?:Correct\s+)?(?:Answer|Ans|Key|Solution):?\s*(.+)$/i);
        if (answerMatch) {
            correctAnswer = answerMatch[1].trim();
            currentSection = 'answer';
            
            // Check if answer is True or False - convert to multiple choice if needed
            const answerLower = correctAnswer.toLowerCase().trim();
            if ((answerLower === 'true' || answerLower === 'false' || answerLower === 't' || answerLower === 'f') && options.length === 0) {
                questionType = 'multiple_choice';
                options.push('True');
                options.push('False');
                // Normalize answer
                if (answerLower === 'true' || answerLower === 't') {
                    correctAnswer = 'True';
                } else {
                    correctAnswer = 'False';
                }
                continue;
            }
            
            // If answer is just a letter (A, B, C), map to option text
            if (/^[A-F]$/i.test(correctAnswer)) {
                const letterIndex = correctAnswer.toUpperCase().charCodeAt(0) - 65;
                if (options[letterIndex]) {
                    correctAnswer = options[letterIndex];
                }
            }
            continue;
        }
        
        // Continuation of current section
        if (currentSection === 'question' && questionText) {
            // Check if line contains True/False indicator
            if (/true\s*\/\s*false|true\s+or\s+false/i.test(line)) {
                questionType = 'multiple_choice';
                if (options.length === 0) {
                    options.push('True');
                    options.push('False');
                }
            }
            // Append to question if it doesn't look like an option or answer
            if (!/^[A-F][\)\.]|^Answer|^Correct|^\d+\s*marks/i.test(line)) {
                questionText += ' ' + line;
            }
        } else if (currentSection === 'options' && collectingOption && options.length > 0) {
            // Continue last option
            if (!/^[A-F][\)\.]|^Answer|^Correct|^\d+\./i.test(line)) {
                options[options.length - 1] += ' ' + line;
            }
        } else if (currentSection === 'answer' && correctAnswer) {
            // Continue answer
            correctAnswer += ' ' + line;
        }
    }
    
    // Check if question text contains True/False indicators
    const questionLower = questionText.toLowerCase();
    const hasTrueFalseInText = /true\s*\/\s*false|true\s+or\s+false|^true\s*:?\s*false|^false\s*:?\s*true|true\/false/i.test(questionText);
    
    // Determine question type if not already set
    if (questionType === 'multiple_choice') {
        if (options.length === 0) {
            // Check if it's a true/false question based on text or answer
            if (hasTrueFalseInText || (correctAnswer && /^true|false$/i.test(correctAnswer.trim()))) {
                // It's a true/false question - add options
                options = ['True', 'False'];
                // Set correct answer if not set
                if (!correctAnswer || !/^true|false$/i.test(correctAnswer.trim())) {
                    // Try to extract from question text
                    const tfMatch = questionText.match(/(?:answer|ans):\s*(true|false)/i);
                    if (tfMatch) {
                        correctAnswer = tfMatch[1].charAt(0).toUpperCase() + tfMatch[1].slice(1).toLowerCase();
                    } else {
                        correctAnswer = 'True'; // Default
                    }
                } else {
                    // Normalize correct answer
                    const ansLower = correctAnswer.trim().toLowerCase();
                    correctAnswer = (ansLower === 'true' || ansLower === 't') ? 'True' : 'False';
                }
                questionType = 'multiple_choice';
            } else {
                // No options and not true/false - check if it's short answer or essay
                if (questionText.length > 200 || /explain|describe|discuss|analyze/i.test(questionText)) {
                    questionType = 'essay';
                } else {
                    questionType = 'short_answer';
                }
            }
        } else if (options.length === 2 && 
                   (options.some(opt => /^true$/i.test(opt.trim())) && options.some(opt => /^false$/i.test(opt.trim())))) {
            // If True/False detected as options, keep as multiple_choice (not true_false type)
            // This way students see it as options A) True, B) False
            questionType = 'multiple_choice';
        }
    } else if (questionType !== 'multiple_choice' && questionType !== 'essay' && questionType !== 'short_answer') {
        // Check if it's a true/false question that wasn't detected yet
        if (hasTrueFalseInText || (correctAnswer && /^true|false$/i.test(correctAnswer.trim()))) {
            questionType = 'multiple_choice';
            options = ['True', 'False'];
            // Normalize correct answer
            if (correctAnswer) {
                const ansLower = correctAnswer.trim().toLowerCase();
                correctAnswer = (ansLower === 'true' || ansLower === 't') ? 'True' : 'False';
            } else {
                correctAnswer = 'True'; // Default
            }
        }
    }
    
    // If questionType was set to true_false from detection, convert to multiple_choice with options
    if (questionType === 'true_false') {
        // Convert to multiple choice with True/False as options
        if (options.length === 0) {
            options = ['True', 'False'];
        } else {
            // Ensure True and False are in options
            if (!options.some(opt => /true/i.test(opt))) {
                options.unshift('True');
            }
            if (!options.some(opt => /false/i.test(opt))) {
                options.push('False');
            }
            // Normalize to exactly ['True', 'False']
            options = ['True', 'False'];
        }
        
        // Set correct answer to match one of the options
        if (correctAnswer) {
            const answerLower = correctAnswer.toLowerCase().trim();
            if (answerLower === 'true' || answerLower === 't') {
                correctAnswer = 'True';
            } else if (answerLower === 'false' || answerLower === 'f') {
                correctAnswer = 'False';
            } else {
                // Try to match existing answer to options
                const matchedOption = options.find(opt => opt.toLowerCase() === answerLower);
                correctAnswer = matchedOption || 'True'; // Default to True if no match
            }
        } else {
            correctAnswer = 'True'; // Default
        }
        
        questionType = 'multiple_choice'; // Change to multiple_choice so students see options
    }
    
    // Clean up question text
    questionText = questionText
        .replace(/\[.*?marks?.*?\]/gi, '')
        .replace(/\(.*?marks?.*?\)/gi, '')
        .trim();
    
    return {
        question_text: questionText,
        question_type: questionType,
        options: questionType === 'multiple_choice' ? JSON.stringify(options) : null,
        correct_answer: correctAnswer || '',
        marks: marks,
        sequence_order: questionNumber
    };
}

/**
 * Validate parsed question
 */
function validateQuestion(question) {
    if (!question.question_text || question.question_text.length < 5) {
        return false;
    }
    
    if (question.question_type === 'multiple_choice') {
        if (!question.options || question.options === '[]') {
            return false;
        }
        const options = parseQuestionOptions(question.options);
        if (options.length < 2) {
            return false;
        }
        if (!question.correct_answer) {
            return false;
        }
    }
    
    // True/false questions are now handled as multiple_choice with True/False options
    // No separate validation needed
    
    if (question.marks < 1 || question.marks > 1000) {
        question.marks = 1; // Default to 1 if invalid
    }
    
    return true;
}

/**
 * Split text by question markers
 */
function splitIntoQuestionBlocks(text) {
    // Multiple strategies for splitting
    
    // Strategy 1: By numbered questions
    const numberedPattern = /(?=^(?:Question\s*)?\d+[\.:]|^Q\d+[\.:])/gim;
    const numberedMatches = [...text.matchAll(numberedPattern)];
    
    if (numberedMatches.length > 1) {
        const blocks = [];
        for (let i = 0; i < numberedMatches.length; i++) {
            const start = numberedMatches[i].index;
            const end = i < numberedMatches.length - 1 ? numberedMatches[i + 1].index : text.length;
            blocks.push(text.substring(start, end).trim());
        }
        return blocks.filter(b => b.length > 10);
    }
    
    // Strategy 2: By double line breaks
    const doubleBreakBlocks = text.split(/\n\s*\n+/);
    if (doubleBreakBlocks.length > 1) {
        return doubleBreakBlocks.filter(b => b.trim().length > 10);
    }
    
    // Strategy 3: Single block
    return [text];
}

// Export for use in lecturer-exam.js
if (typeof window !== 'undefined') {
    window.parseQuestionsFromTextEnhanced = parseQuestionsFromTextEnhanced;
}
