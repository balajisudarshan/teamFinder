import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teamfinder_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle error messages cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    
    // If unauthorized, could clear token if needed
    if (error.response?.status === 401) {
      // Avoid redirect loops, but clear stale token if logged out
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
