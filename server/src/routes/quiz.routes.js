import express from 'express';
import { 
  createQuiz, 
  getTeacherQuizzes, 
  getQuizForStudent, 
  getQuizById 
} from '../controllers/quiz.controller.js';

// 🔥 1. Uncomment the authentication middleware
import { protect } from '../middleware/auth.middleware.js'; 

const router = express.Router();

// 🔥 2. Add 'protect' here so req.user gets populated when creating a quizs
router.post('/', protect, createQuiz);

// 🔥 3. Add 'protect' here as well for dashboard security
router.get('/', protect, getTeacherQuizzes);

// Student gets a quiz (Public link - No protect middleware needed here)
router.get('/:id/student', getQuizForStudent);

// Teacher gets a single full quiz for reports
router.get('/:id', protect, getQuizById); 

export default router;