import 'dotenv/config';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';

// Import Routes
import authRoutes from './src/routes/auth.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';
import resultRoutes from './src/routes/result.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
dotenv.config();

const app = express();

// 1. ENABLE CORS FIRST!
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  credentials: true, 
}));

// 2. Set Security HTTP Headers
app.use(helmet());

// 3. Global Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again in 10 minutes.',
});
app.use('/api', limiter);

// 4. Body Parser & Cookie Parser
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 5. Data Sanitization
// app.use(mongoSanitize());

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/ai', aiRoutes);
// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

export default app;