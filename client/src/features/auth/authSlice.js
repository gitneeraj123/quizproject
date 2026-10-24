import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Older builds kept the token in localStorage — wipe anything left behind.
try {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
} catch {
  // Storage can be unavailable (private mode); nothing to clean up then.
}

const initialState = {
  user: null,
  isAuthenticated: false,
  // Whether we've asked the server (via the refresh cookie) if a session exists yet
  sessionStatus: 'idle', // 'idle' | 'checking' | 'done'
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async () => authService.restoreSession(),
  {
    // Only ever check once. Also stops StrictMode's double effect from sending two
    // refresh requests at once, where the second would fail on the rotated token.
    condition: (_, { getState }) => getState().auth.sessionStatus === 'idle',
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, thunkAPI) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    // Log out locally even if the server call fails
    await authService.logout().catch(() => {});
  }
);

const setSignedIn = (state, action) => {
  state.user = action.payload;
  state.isAuthenticated = true;
  state.sessionStatus = 'done';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.sessionStatus = 'checking';
      })
      .addCase(restoreSession.fulfilled, setSignedIn)
      .addCase(restoreSession.rejected, (state) => {
        state.sessionStatus = 'done';
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        setSignedIn(state, action);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.fulfilled, setSignedIn)
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      });
  },
});

export default authSlice.reducer;
