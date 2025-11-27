import axios from 'axios';
import { getToken, clearAuth } from './auth';
import toast from 'react-hot-toast';

// Create axios instance with default configuration
// In production, use relative URL (same origin) or environment variable
// In development, use localhost
const api = axios.create({ 
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || '' // Empty string = same origin (relative URL)
    : 'http://localhost:5000',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;

    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url} (${duration}ms)`, {
        data: response.data,
        headers: response.headers
      });
    }

    return response;
  },
  async (error) => {
    const endTime = new Date();
    const duration = endTime - (error.config?.metadata?.startTime || endTime);

    // Log errors
    console.error('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      duration: `${duration}ms`,
      data: error.response?.data,
      message: error.message
    });

    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          console.warn('🔐 Unauthorized access, clearing authentication');
          clearAuth();
          toast.error('Session expired. Please login again.');
          
          // Redirect to login page if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;

        case 403:
          // Forbidden
          toast.error(data.message || 'Access denied. Insufficient permissions.');
          break;

        case 400:
          // Bad Request - often validation errors
          if (data.errors && Array.isArray(data.errors)) {
            // Don't show toast here, let the component handle it
            // The component will show field-specific errors
          } else {
            toast.error(data.message || 'Invalid request. Please check your input.');
          }
          break;

        case 404:
          // Not found
          toast.error(data.message || 'Resource not found.');
          break;

        case 422:
          // Validation error
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(`${err.field}: ${err.message}`);
            });
          } else {
            toast.error(data.message || 'Validation failed.');
          }
          break;

        case 429:
          // Rate limited
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;

        default:
          // Other client errors
          toast.error(data.message || `Error ${status}: ${data.statusText || 'Unknown error'}`);
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection and try again.');
    } else {
      // Other errors
      toast.error('An unexpected error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Generic GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload helper
  upload: async (url, file, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        } : undefined,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Export the configured axios instance
export default api;

// Export helper functions
export const { get, post, put, delete: del, upload } = apiHelpers; 