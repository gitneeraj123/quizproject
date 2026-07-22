import express from 'express';
import { submitResult, getResultsByQuiz } from '../controllers/result.controller.js';

// import { protect } from '../middleware/auth.js';

const router = express.Router();

// Student submitting a test (Public)
router.post('/', submitResult);

// Teacher viewing results for a specific quiz (Add 'protect' middleware here if using)
router.get('/quiz/:quizId', getResultsByQuiz);

export default router;