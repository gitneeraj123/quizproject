import api, { setAccessToken } from './api';

// Each call that returns an access token hands it to api.js (memory only)
// and returns just the user for Redux.
const startSession = ({ accessToken, user }) => {
  setAccessToken(accessToken);
  return user;
};

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return startSession(response.data);
};

const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  return startSession(response.data);
};

// Uses the httpOnly refresh cookie to get a new access token after a page reload
const restoreSession = async () => {
  const response = await api.post('/auth/refresh-token');
  return startSession(response.data);
};

const logout = async () => {
  setAccessToken(null);
  // Clears the refresh cookie and revokes the token on the backend
  await api.post('/auth/logout');
};

const authService = {
  register,
  login,
  restoreSession,
  logout,
};

export default authService;
