import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import { evaluateSubmission } from '../services/evaluation.service.js';

// @desc    Submit student quiz answers
// @route   POST /api/v1/results
export const submitResult = async (req, res) => {
  try {
    const { quizId, studentName, studentIdentifier, studentAnswers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Call our clean evaluation service engine
    const { score, totalQuestions, accuracy } = evaluateSubmission(quiz, studentAnswers);

    // 🔥 FIX 1: Force Mongoose to use the native database ObjectId from the found quiz
    const result = await Result.create({
      quizId: quiz._id, 
      studentName,
      studentIdentifier,
      score,
      totalQuestions,
      accuracy,
      studentAnswers
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process submission.' });
  }
};

// @desc    Get all results for a specific quiz (For Teacher Dashboard)
// @route   GET /api/v1/results/quiz/:quizId
export const getResultsByQuiz = async (req, res) => {
  try {
    console.log(`\n=== 📊 FETCHING REPORTS FOR QUIZ: ${req.params.quizId} ===`);

    // 🔥 FIX 2: Search for BOTH the String and ObjectId formats just in case, and sort by createdAt
    const results = await Result.find({
      $or: [
        { quizId: req.params.quizId },
        { quizId: req.params.quizId.toString() }
      ]
    }).sort('-createdAt');

    console.log(`-> Found ${results.length} student submissions!`);

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};