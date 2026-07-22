import express from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = express.Router();

// Maps to POST /api/v1/auth/register
router.post('/register', register);

// Maps to POST /api/v1/auth/login (This is the one your React app is looking for!)
router.post('/login', login);

export default router;