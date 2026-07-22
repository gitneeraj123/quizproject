import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateQuizFromText = async (textContent, gradeLevel, questionCount) => {
  try {
    const prompt = `
      You are an expert assessment generator. Analyze the following content and generate exactly ${questionCount} high-quality quiz questions tailored for${gradeLevel} students.
      
      Content:
      "${textContent}"

      CRITICAL INSTRUCTIONS:
      1. You MUST respond ONLY with a valid JSON object. Do not include markdown formatting, markdown code blocks (such as \`\`\`json), or any conversational text.
      
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
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || '';
    
    const cleanJsonString = responseText
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    const data = JSON.parse(cleanJsonString);

    // 2. The Unbreakable Shuffle Logic
    if (data.questions && Array.isArray(data.questions)) {
      data.questions = data.questions.map((q) => {
        if (!q.options) return q;

        // LLMs are stubborn. Let's catch ALL possible names it might use for the answer key:
        let rawAnswers = q.correctAnswers !== undefined ? q.correctAnswers 
                       : (q.correctAnswer !== undefined ? q.correctAnswer 
                       : (q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : [0]));
                       
        // Force it into a strict array format
        const answerIndices = Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers];

        // Safely extract what the correct answer ACTUALLY says
        const correctTexts = answerIndices.map(idx => {
           const opt = q.options[idx];
           return typeof opt === 'string' ? opt : (opt?.text || '');
        });

        // True Randomization: Fisher-Yates Shuffle algorithm
        const shuffled = [...q.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Find the new index of the correct answer in the freshly shuffled array
        const newIndices = shuffled
          .map((opt, i) => {
             const optText = typeof opt === 'string' ? opt : (opt?.text || '');
             return correctTexts.includes(optText) ? i : -1;
          })
          .filter(idx => idx !== -1);

        return { 
          ...q, 
          options: shuffled, 
          // Always return the exact key name the frontend is looking for
          correctAnswers: newIndices.length > 0 ? newIndices : [0] 
        };
      });
    }

    return data;
  } catch (error) {
    console.error('Error in Groq AI Service:', error);
    throw new Error('Failed to parse AI response into structural quiz data.');
  }
};