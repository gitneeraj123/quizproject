import Groq from 'groq-sdk';

// Free tier allows 8k tokens/minute. Batches bigger than this risk hitting that in one go;
// when later batches do hit it, the SDK waits for the retry-after window and tries again.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 5 });

export const MAX_QUESTIONS = 50;
const BATCH_SIZE = 25;

const DIFFICULTY_GUIDE = {
  Easy: 'Test recall and basic understanding: definitions, key facts, and simple identification.',
  Medium: 'Test understanding and application: ask why or how things work, and apply concepts to short, concrete examples. At most a quarter of the questions may be pure recall.',
  Hard: 'Test analysis and evaluation: scenario-based questions, multi-step reasoning, comparing or predicting outcomes, and spotting errors. No pure recall questions. A student who only memorised keywords must not be able to answer them.',
};

const buildSystemPrompt = (gradeLevel, difficulty) => `
You are an expert exam writer creating multiple-choice questions for ${gradeLevel} students.
Difficulty: ${difficulty}. ${DIFFICULTY_GUIDE[difficulty]}

Quality rules:
- Every question has exactly 4 options and exactly one correct answer.
- Wrong options must be plausible: based on common misconceptions, similar in length and style to the correct one.
- Do not use "All of the above" or "None of the above". Do not make the correct answer the longest option.
- Each question must test a different idea. Never repeat or rephrase an earlier question.
- Only use facts supported by the provided content; if it is just a topic, use well-established knowledge.

Respond ONLY with a JSON object in this exact compact shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correct":0}]}
"correct" is the 0-based index of the correct option.
`;

const buildUserPrompt = (textContent, count, previousQuestions) => {
  let prompt = `Content:\n"""\n${textContent}\n"""\n\nWrite exactly ${count} questions.`;
  if (previousQuestions.length > 0) {
    prompt += `\n\nThese questions already exist. Do not repeat or rephrase any of them:\n- ${previousQuestions.join('\n- ')}`;
  }
  return prompt;
};

const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Turn one compact AI question into the full Quiz schema shape, with options shuffled.
// Returns null for malformed questions so one bad item doesn't fail the whole quiz.
const toQuizQuestion = (q) => {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return null;
  if (!Array.isArray(q.options) || q.options.length < 2) return null;

  const correctIndex = Number(q.correct);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= q.options.length) return null;

  // Track the correct option by its original position, not its text
  const shuffled = shuffle(q.options.map((text, idx) => ({ text: String(text), isCorrect: idx === correctIndex })));

  return {
    question: q.question.trim(),
    type: 'Multiple Choice',
    imageUrl: null,
    options: shuffled.map(({ text }) => ({ text, imageUrl: null })),
    correctAnswers: [shuffled.findIndex(opt => opt.isCorrect)],
    multipleCorrect: false,
    timeLimit: 1,
    points: 1,
  };
};

const generateBatch = async (textContent, count, gradeLevel, difficulty, previousQuestions) => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: buildSystemPrompt(gradeLevel, difficulty) },
      { role: 'user', content: buildUserPrompt(textContent, count, previousQuestions) },
    ],
    // llama-3.1-8b-instant was shut down by Groq on 2026-08-16; override via GROQ_MODEL if this one is retired too
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    temperature: 0.5,
    // gpt-oss is a reasoning model: its thinking counts toward this limit, so keep reasoning low
    reasoning_effort: 'low',
    max_completion_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const responseText = chatCompletion.choices[0]?.message?.content || '';
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error('Failed to parse AI response as valid JSON.');
  }
  if (!Array.isArray(data?.questions)) {
    throw new Error('AI response missing "questions" array.');
  }
  return data.questions.map(toQuizQuestion).filter(Boolean);
};

export const generateQuizFromText = async (textContent, gradeLevel, questionCount, difficulty = 'Medium') => {
  const target = Math.min(Math.max(parseInt(questionCount) || 10, 1), MAX_QUESTIONS);
  const level = DIFFICULTY_GUIDE[difficulty] ? difficulty : 'Medium';

  const questions = [];
  const seen = new Set();

  // Generate in batches, telling each batch what already exists so questions don't repeat.
  // A couple of extra attempts cover batches where the model returns fewer than asked.
  const maxAttempts = Math.ceil(target / BATCH_SIZE) + 2;
  for (let attempt = 0; attempt < maxAttempts && questions.length < target; attempt++) {
    const count = Math.min(BATCH_SIZE, target - questions.length);
    const batch = await generateBatch(textContent, count, gradeLevel, level, questions.map(q => q.question));

    for (const q of batch) {
      const key = q.question.toLowerCase();
      if (!seen.has(key) && questions.length < target) {
        seen.add(key);
        questions.push(q);
      }
    }
  }

  if (questions.length === 0) {
    throw new Error('AI did not return any valid questions.');
  }
  return { questions };
};
