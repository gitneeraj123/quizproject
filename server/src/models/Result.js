import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  studentName: { type: String, required: true },
  studentIdentifier: { type: String, required: true }, // Email or Roll Number
  
  // Analytics
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  
  // Storing what they actually picked: { "0": [1, 2], "1": [0] }
  studentAnswers: { type: Map, of: [Number] },
  
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Result', ResultSchema);