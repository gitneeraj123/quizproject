/**
 * @desc    Securely grades a student submission against the original database quiz document
 * @param   {Object} quiz - The complete original Quiz document from MongoDB
 * @param   {Object} studentAnswers - Map of student selections (e.g., { "0": [1], "1": [0, 2] })
 * @returns {Object} Calculated metrics: score, totalQuestions, accuracy
 */
export const evaluateSubmission = (quiz, studentAnswers) => {
  const totalQuestions = quiz.questions.length;

  // Bug #29: Guard against zero questions
  if (totalQuestions === 0) {
    return { score: 0, totalQuestions: 0, accuracy: 0 };
  }

  let correctCount = 0;

  quiz.questions.forEach((question, index) => {
    // Safely extract student answers
    let rawStudent = studentAnswers[index];
    const studentIndices = (rawStudent !== undefined && rawStudent !== null) 
      ? (Array.isArray(rawStudent) ? rawStudent : [rawStudent]) 
      : [];

    // Safely extract correct answers
    let rawCorrect = question.correctAnswers;
    const actualCorrectRaw = (rawCorrect !== undefined && rawCorrect !== null) 
      ? (Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect]) 
      : [];

    // Check if the AI saved a text string instead of a number
    const isTextBased = actualCorrectRaw.length > 0 && 
                        typeof actualCorrectRaw[0] === 'string' && 
                        isNaN(Number(actualCorrectRaw[0]));

    let isCorrect = false;

    if (question.type === 'Fill in the Blank') {
      const studentText = studentIndices[0]?.toString().trim().toLowerCase() || '';
      const correctText = question.options[0]?.text?.toString().trim().toLowerCase() || '';
      if (studentText === correctText && correctText !== '') {
        isCorrect = true;
      }
    } else if (isTextBased) {
      const normalizedStudent = studentIndices.map(i => {
        const opt = question.options[Number(i)];
        const text = typeof opt === 'string' ? opt : (opt?.text || '');
        return text.toString().trim().toLowerCase();
      }).sort();
      
      const normalizedCorrect = actualCorrectRaw.map(ans => ans.toString().trim().toLowerCase()).sort();
      if (JSON.stringify(normalizedStudent) === JSON.stringify(normalizedCorrect)) {
        isCorrect = true;
      }
    } else {
      const normalizedStudent = studentIndices.map(Number).sort((a, b) => a - b);
      const normalizedCorrect = actualCorrectRaw.map(Number).sort((a, b) => a - b);
      if (JSON.stringify(normalizedStudent) === JSON.stringify(normalizedCorrect)) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      correctCount++;
    }
  });

  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  return {
    score: correctCount,
    totalQuestions,
    accuracy
  };
};