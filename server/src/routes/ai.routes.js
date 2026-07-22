import express from 'express';
import multer from 'multer';
import { generateQuiz } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Keep the file in RAM as a Buffer, max size 10MB
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

router.use(protect);

// Endpoint expects a file attached to the field name 'document'
router.post('/generate-quiz', upload.single('document'), generateQuiz);

export default router;