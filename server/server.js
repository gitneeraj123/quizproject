import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import app from './app.js'; 
import { startCleanupScheduler, deleteExpiredQuizzes } from './src/services/cleanup.service.js';

// Load environment variables first
dotenv.config();

// Connect to MongoDB
connectDB();

// Create the HTTP server using the Express app
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
  startCleanupScheduler();
  await deleteExpiredQuizzes(); // Run once immediately on startup
});