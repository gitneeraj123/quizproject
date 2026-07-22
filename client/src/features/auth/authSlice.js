import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// 1. CHECK LOCAL STORAGE ON BOOT: 
// When the app loads, see if we already saved a user and token yesterday
const storedUser = JSON.parse(localStorage.getItem('user'));
const storedToken = localStorage.getItem('accessToken');

const initialState = {
  user: storedUser || null,
  accessToken: storedToken || null,
  isAuthenticated: !!storedToken, // If there's a token, they are authenticated!
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, thunkAPI) => {
    try {
      const response = await authService.login(credentials);
      
      // 2. SAVE TO LOCAL STORAGE: 
      // The moment they successfully log in, save the token to the hard drive
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      
      // 3. WIPE LOCAL STORAGE: 
      // Destroy the saved token when they log out
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      authService.logout(); // Clears cookie on backend
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;