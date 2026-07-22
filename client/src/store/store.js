import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // We will add quizReducer, attemptReducer, etc. here later
  },
  // Redux Toolkit automatically adds thunk middleware and enables Redux DevTools
});