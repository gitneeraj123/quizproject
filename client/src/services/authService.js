import api from './api';

// Register user
const register = async (userData) => {
  const response = await api.post('/auth/register', userData);

  if (response.data && response.data.accessToken) {
    // Save the token and user to local storage
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await api.post('/auth/login', userData);

  if (response.data && response.data.accessToken) {
    // Save the token and user to local storage
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

// Logout user
const logout = () => {
  // Destroy the token on logout
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

const authService = {
  register,
  login,
  logout,
};

export default authService;