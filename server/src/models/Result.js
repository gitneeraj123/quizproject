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
  
  // Storing what they actually picked: { "0": [1, 2], "1": ["Paris"] }
  studentAnswers: { type: Map, of: mongoose.Schema.Types.Mixed },
  quizSnapshot: {
    title: String,
    questions: [{
      question: String,
      type: { type: String },
      imageUrl: String,
      options: [{ text: String, imageUrl: String }],
      correctAnswers: [Number]
    }]
  },
  
  completedAt: { type: Date, default: Date.now },
  tabSwitchCount: { type: Number, default: 0 }
});

ResultSchema.index({ quizId: 1, studentIdentifier: 1 }, { unique: true });

export default mongoose.model('Result', ResultSchema);