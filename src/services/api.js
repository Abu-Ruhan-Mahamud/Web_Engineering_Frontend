import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Set JSON content type by default (can be overridden by requests with FormData)
api.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch event so AuthContext can react without hard reload
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

/**
 * Extract list data from a DRF paginated response or a plain array.
 * DRF paginated responses look like: { count, next, previous, results: [...] }
 * Non-paginated responses are just: [...]
 */
export function getResults(data) {
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return data.results;
  }
  return Array.isArray(data) ? data : [];
}

export default api;
