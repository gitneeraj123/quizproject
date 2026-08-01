import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Validates that the parsed AI response has the expected shape.
 * Each question must have: question (string), options (array of >=2), correctAnswers (array of numbers).
 */
function validateQuizShape(data) {
  if (!data || !Array.isArray(data.questions)) {
    throw new Error('AI response missing "questions" array.');
  }

  data.questions.forEach((q, i) => {
    if (!q.question || typeof q.question !== 'string') {
      throw new Error(`Question ${i + 1}: missing or invalid "question" text.`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${i + 1}: must have at least 2 options.`);
    }
  });
}

export const generateQuizFromText = async (textContent, gradeLevel, questionCount) => {
  try {
    const prompt = `
      You are an expert assessment generator. Analyze the following content and generate exactly ${questionCount} high-quality quiz questions tailored for ${gradeLevel} students.
      
      Content:
      "${textContent}"

      CRITICAL INSTRUCTIONS:
      1. You MUST respond ONLY with a valid JSON object. Do not include markdown formatting, markdown code blocks (such as \`\`\`json), or any conversational text.
      2. You MUST generate EXACTLY ${questionCount} questions. Do not stop early. Your "questions" array must contain exactly ${questionCount} items.
      
      The JSON object must match this exact structure layout:
      {
        "questions": [
          {
            "question": "The text of the question?",
            "type": "Multiple Choice",
            "imageUrl": null,
            "options": [
              { "text": "Option A text", "imageUrl": null },
              { "text": "Option B text", "imageUrl": null },
              { "text": "Option C text", "imageUrl": null },
              { "text": "Option D text", "imageUrl": null }
            ],
            "correctAnswers": [0], 
            "multipleCorrect": false,
            "timeLimit": 1,
            "points": 1
          }
        ]
      }

      Formatting rules for your response:
      1. "correctAnswers" must always be an array of numbers containing the 0-indexed position of the correct option.
      2. Keep "imageUrl" as null for all fields.
      3. Ensure the JSON is completely valid and properly escaped.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "llama-3.1-8b-instant", 
      temperature: 0.3,
      max_tokens: 3500,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || '';
    
    let cleanJsonString = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJsonString = jsonMatch[0];
    }
    
    const data = JSON.parse(cleanJsonString);

    // Bug #22: Validate the shape of the parsed AI response
    validateQuizShape(data);

    // Shuffle options and remap correct answers
    if (data.questions && Array.isArray(data.questions)) {
      data.questions = data.questions.map((q) => {
        if (!q.options || q.options.length < 2) return q;

        // Normalize the answer key from various LLM formats
        let rawAnswers = q.correctAnswers !== undefined ? q.correctAnswers 
                       : (q.correctAnswer !== undefined ? q.correctAnswer 
                       : (q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : [0]));
                       
        const answerIndices = Array.isArray(rawAnswers) ? rawAnswers.map(Number) : [Number(rawAnswers)];

        // Bug #23: Filter out any out-of-bounds indices
        const validAnswerIndices = answerIndices.filter(idx => idx >= 0 && idx < q.options.length);
        if (validAnswerIndices.length === 0) {
          throw new Error(`Question "${q.question.substring(0, 50)}..." has no valid correctAnswers indices.`);
        }

        // Bug #21: Track correct answers by original index, not text matching
        // Tag each option with its original index before shuffling
        const taggedOptions = q.options.map((opt, idx) => ({
          ...opt,
          _originalIndex: idx
        }));

        // Fisher-Yates shuffle
        const shuffled = [...taggedOptions];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Find the new indices of the correct answers using original index tracking
        const newIndices = shuffled
          .map((opt, newIdx) => validAnswerIndices.includes(opt._originalIndex) ? newIdx : -1)
          .filter(idx => idx !== -1);

        // Remove the tracking tag before returning
        const cleanOptions = shuffled.map(({ _originalIndex, ...rest }) => rest);

        return { 
          ...q, 
          options: cleanOptions, 
          correctAnswers: newIndices
        };
      });
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response as valid JSON.');
    }
    throw error;
  }
};