import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import { evaluateSubmission } from '../services/evaluation.service.js';

// @desc    Submit student quiz answers
// @route   POST /api/v1/results
export const submitResult = async (req, res) => {
  try {
    const { quizId, studentName, studentIdentifier, studentAnswers, tabSwitchCount } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'This quiz has no questions.' });
    }

    // Check for duplicate submission
    const existingResult = await Result.findOne({ quizId: quiz._id, studentIdentifier });
    if (existingResult) {
      return res.status(409).json({ success: false, message: 'You have already submitted this quiz.' });
    }

    const { score, totalQuestions, accuracy } = evaluateSubmission(quiz, studentAnswers);

    // Snapshot the quiz at submission time for historical accuracy
    const quizSnapshot = {
      title: quiz.title,
      questions: quiz.questions.map(q => ({
        question: q.question,
        type: q.type,
        imageUrl: q.imageUrl,
        options: (q.options || []).map(o => ({ text: o.text, imageUrl: o.imageUrl })),
        correctAnswers: q.correctAnswers
      }))
    };

    const result = await Result.create({
      quizId: quiz._id,
      studentName,
      studentIdentifier,
      score,
      totalQuestions,
      accuracy,
      studentAnswers,
      tabSwitchCount: tabSwitchCount || 0,
      quizSnapshot
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Submit Error:", error);
    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already submitted this quiz.' });
    }
    res.status(500).json({ success: false, message: 'Failed to process submission.' });
  }
};

// @desc    Get all results for a specific quiz (For Teacher Dashboard)
// @route   GET /api/v1/results/quiz/:quizId
export const getResultsByQuiz = async (req, res) => {
  try {
    const results = await Result.find({ quizId: req.params.quizId }).sort('-createdAt');
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};