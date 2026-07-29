import Quiz from '../models/Quiz.js';

// @desc    Create a new quiz (Teacher hits "Publish")
// @route   POST /api/v1/quizzes
export const createQuiz = async (req, res) => {
  try {
    // 🔥 THE FIX: Bulletproof ID extraction. Catches it no matter how the auth middleware formats it!
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Cannot attach user to quiz.' });
    }

    const quizData = {
      ...req.body,
      createdBy: userId 
    };

    const quiz = await Quiz.create(quizData);
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all quizzes for a teacher (For the "Sessions" Dashboard)
// @route   GET /api/v1/quizzes
export const getTeacherQuizzes = async (req, res) => {
  try {
    // 🔥 THE SLEDGEHAMMER FIX: Fetch ALL quizzes in the database to guarantee they show up
    const userId = req.user?._id || req.user?.id;
    const quizzes = await Quiz.find({ createdBy: userId }).sort('-createdAt');
    
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get a single quiz for a student (Strips out correct answers!)
// @route   GET /api/v1/quizzes/:id/student
export const getQuizForStudent = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Convert mongoose doc to plain object so we can delete properties
    const quizObj = quiz.toObject();

    // SECURITY: Remove correctAnswers so students can't cheat
    if (quizObj.questions && Array.isArray(quizObj.questions)) {
      quizObj.questions.forEach(q => {
        delete q.correctAnswers;
      });
    }

    res.status(200).json({ success: true, data: quizObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Invalid Quiz Link' });
  }
};

// @desc    Get a single quiz for a teacher (Keeps correct answers intact!)
// @route   GET /api/v1/quizzes/:id
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Returns the full quiz document, exactly as the teacher created it
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error retrieving quiz' });
  }
};