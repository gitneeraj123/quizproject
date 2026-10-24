import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  imageUrl: { type: String, default: null }
});

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, default: 'Multiple Choice' }, 
  imageUrl: { type: String, default: null },
  options: [OptionSchema],
  correctAnswers: { type: [Number], required: true }, 
  timeLimit: { type: Number, default: 1 },
  points: { type: Number, default: 1 },
  multipleCorrect: { type: Boolean, default: false }
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, default: 'General' },
  grade: { type: String, default: 'Any' },
  coverImage: { type: String, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['published', 'closed'],
    default: 'published'
  },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
  timerType: {
    type: String,
    enum: ['session', 'question'],
    default: 'session'
  },
  startsAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Quiz', QuizSchema);