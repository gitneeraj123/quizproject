import axios from 'axios';

const api = axios.create({
  // Same origin: in production Express serves this app; in dev Vite proxies /api (vite.config.js)
  baseURL: '/api/v1',
  withCredentials: true,
});

// The access token lives only in memory (never localStorage), so injected scripts
// can't read it from storage. On page reload it is restored via the httpOnly
// refresh cookie — see restoreSession in AuthContext.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// Request interceptor to attach JWT
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // A 401 from /auth/* (e.g. wrong password on login) is a real answer, not an expired token
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');

    // If we get a 401 and haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');

        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — the session is gone, send the teacher back to login
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
