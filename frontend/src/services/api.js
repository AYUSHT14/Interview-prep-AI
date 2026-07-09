import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Interceptor to inject JWT token and client Gemini key on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const grokKey = localStorage.getItem('grokKey');
    if (grokKey) {
      config.headers['X-Grok-API-Key'] = grokKey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
