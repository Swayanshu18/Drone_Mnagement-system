/**
 * API Service
 * 
 * Axios instance with interceptors for authentication.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://drone-mnagement-system.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - no auth needed
api.interceptors.request.use(
  (config) => {
    // No authentication required
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Just return the error, no auth handling
    return Promise.reject(error);
  }
);

export default api;
