/**
 * @desc    Securely grades a student submission against the original database quiz document
 * @param   {Object} quiz - The complete original Quiz document from MongoDB
 * @param   {Object} studentAnswers - Map of student selections (e.g., { "0": [1], "1": [0, 2] })
 * @returns {Object} Calculated metrics: score, totalQuestions, accuracy
 */
export const evaluateSubmission = (quiz, studentAnswers) => {
  let correctCount = 0;
  const totalQuestions = quiz.questions.length;

  console.log("=== 🚀 GRADING NEW SUBMISSION ===");

  quiz.questions.forEach((question, index) => {
    // 1. Safely extract student answers (Forces into an array, fixes the '0 is empty' bug)
    let rawStudent = studentAnswers[index];
    const studentIndices = (rawStudent !== undefined && rawStudent !== null) 
      ? (Array.isArray(rawStudent) ? rawStudent : [rawStudent]) 
      : [];

    // 2. Safely extract correct answers
    let rawCorrect = question.correctAnswers;
    const actualCorrectRaw = (rawCorrect !== undefined && rawCorrect !== null) 
      ? (Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect]) 
      : [];

    // Check if the AI saved a text string instead of a number
    const isTextBased = actualCorrectRaw.length > 0 && 
                        typeof actualCorrectRaw[0] === 'string' && 
                        isNaN(Number(actualCorrectRaw[0]));

    let normalizedStudent = [];
    let normalizedCorrect = [];

    if (isTextBased) {
      normalizedStudent = studentIndices.map(i => {
        const opt = question.options[Number(i)];
        const text = typeof opt === 'string' ? opt : (opt?.text || '');
        return text.toString().trim().toLowerCase();
      }).sort();
      
      normalizedCorrect = actualCorrectRaw.map(ans => ans.toString().trim().toLowerCase()).sort();
    } else {
      normalizedStudent = studentIndices.map(Number).sort((a, b) => a - b);
      normalizedCorrect = actualCorrectRaw.map(Number).sort((a, b) => a - b);
    }
    
    // 🔥 DEBUGGING OUTPUT - Prints to your terminal!
    console.log(`Q${index + 1}:`);
    console.log(`  Student selected:`, normalizedStudent);
    console.log(`  Actual correct:  `, normalizedCorrect);

    if (JSON.stringify(normalizedStudent) === JSON.stringify(normalizedCorrect)) {
      correctCount++;
      console.log(`  -> ✅ Correct`);
    } else {
      console.log(`  -> ❌ Wrong`);
    }
  });

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  console.log(`FINAL SCORE: ${correctCount} / ${totalQuestions}`);
  console.log("=================================");

  return {
    score: correctCount,
    totalQuestions,
    accuracy
  };
};