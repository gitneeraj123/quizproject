# AI-Powered Quiz Assessment Platform

A comprehensive, full-stack MERN (MongoDB, Express, React, Node.js) application for generating, managing, and taking quizzes. Designed for educators to create robust assessments featuring anti-cheat mechanisms, flexible timers, and AI-powered question generation.

## 🚀 Key Features

### 🤖 AI Question Generation
Instantly generate up to 25 context-aware questions from raw text using the Groq Llama-3 API. 
Supports multiple formats: Multiple Choice, True/False, and Fill in the Blank.

### 🛡️ Advanced Anti-Cheat System
Designed for academic integrity:
- **Clipboard Blocking:** Prevents students from copying question text to paste into search engines.
- **Context Menu Blocking:** Disables right-click functionality.
- **Tab Tracking:** Actively tracks and warns students when they switch browser tabs, minimize the window, or open other applications. Violations are logged to the teacher's report.

### ⏱️ Flexible Assessment Timers
- **Session Mode:** A global countdown timer for the entire assessment.
- **Per-Question Mode:** Strict time limits enforced individually for each question, advancing automatically when time runs out.

### 📅 Automated Scheduling & Cleanup
- **Start Times:** Set future start times to securely lock assessments with a cryptographic countdown until they go live.
- **Deadlines:** Set expiry dates to automatically close assessments.
- **Background Cleanup:** A background cron service automatically sweeps and closes expired quizzes, keeping the dashboard clean while preserving all historical student reports.

### 🎨 Modern, Responsive UI
- Built with React and TailwindCSS for a premium feel.
- Features a sticky sidebar Question Navigator that handles 100+ questions effortlessly without breaking layout.
- Custom organization branding support.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB Atlas
- **AI Integration:** Groq SDK (Llama 3.1 8B)
- **Security:** Helmet, Express Rate Limit, JWT Authentication

## 📦 Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas cluster

### 2. Backend Setup
Navigate to the `server` directory, install dependencies, and configure your environment variables:
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the `client` directory, install dependencies, and start the Vite development server:
```bash
cd client
npm install
npm run dev
```

The application will be running at `http://localhost:5173`.
