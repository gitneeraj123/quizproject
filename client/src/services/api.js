import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Crucial for sending the HTTP-only refresh cookie
});

// Request interceptor to attach JWT
api.interceptors.request.use((config) => {
  // Assuming you have a way to get the token, perhaps from a store snapshot or local storage
  // In Redux, you typically inject the store into the interceptor setup
  const token = localStorage.getItem('accessToken'); // Grab token from memory
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach it!
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;