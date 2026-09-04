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
    
    // If action rejected because account or team is flagged, broadcast immediately
    if (
      error.response?.status === 403 &&
      (message.toLowerCase().includes('flagged') || error.response?.data?.isFlagged)
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('account-flagged', { detail: { message } }));
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
