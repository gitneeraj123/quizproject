import cron from 'node-cron';
import Quiz from '../models/Quiz.js';

/**
 * Deletes Quiz documents whose expiresAt date has passed.
 * Results are NOT touched — each Result already stores a full quizSnapshot,
 * so Sessions & Reports continue to work after the source Quiz is gone.
 */
export const deleteExpiredQuizzes = async () => {
  try {
    const now = new Date();
    // Instead of deleting, we 'close' them. This hides them from Home but keeps them in Sessions/Reports.
    const result = await Quiz.updateMany(
      { expiresAt: { $ne: null, $lt: now }, status: { $ne: 'closed' } },
      { $set: { status: 'closed' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[cleanup] Closed ${result.modifiedCount} expired quiz(zes).`);
    }
  } catch (err) {
    console.error('[cleanup] Failed to delete expired quizzes:', err.message);
  }
};

// Runs once every hour, on the hour
export const startCleanupScheduler = () => {
  cron.schedule('0 * * * *', deleteExpiredQuizzes);
  console.log('[cleanup] Expired-quiz cleanup scheduler started (runs hourly).');
};
