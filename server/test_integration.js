import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Quiz from './src/models/Quiz.js';
import Result from './src/models/Result.js';
import { deleteExpiredQuizzes } from './src/services/cleanup.service.js';

const runTests = async () => {
  try {
    console.log("🟡 Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB.");

    // 1. Create Teacher
    const randomStr = Math.random().toString(36).substring(7);
    const email = `teacher_${randomStr}@test.com`;
    const teacher = await User.create({
      name: 'Test Teacher',
      email: email,
      password: 'password123',
      organization: 'Test Org'
    });
    console.log(`✅ Teacher created: ${email}`);

    // 2. Create Quiz
    const quiz = await Quiz.create({
      title: 'Integration Test Quiz',
      subject: 'Testing',
      grade: 'Any',
      createdBy: teacher._id,
      status: 'published',
      startsAt: new Date(Date.now() - 10000), // Started 10s ago
      expiresAt: new Date(Date.now() + 3600000), // Expires in 1hr
      timerType: 'session',
      questions: [
        {
          question: 'What is 2 + 2?',
          type: 'Multiple Choice',
          options: [{ text: '3' }, { text: '4' }, { text: '5' }],
          correctAnswers: [1],
          timeLimit: 1,
          points: 1
        }
      ]
    });
    console.log(`✅ Quiz created: ${quiz._id}`);

    // 3. Simulate Student Submission
    const result = await Result.create({
      quizId: quiz._id,
      studentName: 'Test Student',
      studentIdentifier: `student_${randomStr}`,
      score: 1,
      totalQuestions: 1,
      accuracy: 100,
      studentAnswers: {
        [quiz.questions[0]._id]: {
          type: 'Multiple Choice',
          selectedOptions: [1],
          isCorrect: true,
          pointsEarned: 1,
          timeSpent: 10
        }
      },
      quizSnapshot: {
        title: quiz.title,
        questions: []
      }
    });
    console.log(`✅ Student Result submitted: ${result._id}`);

    // 4. Test Auto-Expiration (Cleanup logic)
    quiz.expiresAt = new Date(Date.now() - 10000); // Expired 10s ago
    await quiz.save();
    console.log(`🟡 Forced quiz to expire...`);

    console.log(`🟡 Running Cleanup Service...`);
    await deleteExpiredQuizzes();

    const expiredQuiz = await Quiz.findById(quiz._id);
    if (expiredQuiz.status === 'closed') {
      console.log(`✅ Cleanup Service successfully closed the quiz!`);
    } else {
      console.log(`❌ Cleanup Service failed. Status is: ${expiredQuiz.status}`);
    }

    // 5. Clean up test data
    await User.deleteOne({ _id: teacher._id });
    await Quiz.deleteOne({ _id: quiz._id });
    await Result.deleteOne({ _id: result._id });
    console.log(`✅ Test data cleaned up.`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
};

runTests();
