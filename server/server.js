import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import app from './app.js'; 

// Load environment variables first
dotenv.config();

// Connect to MongoDB
connectDB();

// Create the HTTP server using the Express app
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
});