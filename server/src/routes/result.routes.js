import express from 'express';
import { submitResult, getResultsByQuiz } from '../controllers/result.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student submitting a test (Public - no auth needed)
router.post('/', submitResult);

// Teacher viewing results for a specific quiz (Protected - requires auth)
router.get('/quiz/:quizId', protect, getResultsByQuiz);

export default router;