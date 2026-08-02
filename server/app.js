import 'dotenv/config';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './src/routes/auth.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';
import resultRoutes from './src/routes/result.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again in 10 minutes.',
});
app.use('/api', globalLimiter);

// Bug #28: Stricter rate limiter for login to prevent brute-forcing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', loginLimiter);

// 4. Body Parser & Cookie Parser
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 5. Data Sanitization — Bug #7: Re-enabled NoSQL injection protection
// Note: express-mongo-sanitize middleware throws "Cannot set property query" in Express 5.
// We use it manually to mutate the objects in-place instead of reassigning req.query.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.query) mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});

// 6. Serve uploaded files statically (Bug #9)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// TODO (Bug #27): Timer enforcement should be server-side.
// Currently the quiz timer is only enforced on the client via setInterval.
// A production-grade implementation should record the start time server-side
// and reject late submissions in the submitResult controller.

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

export default app;