import axios from 'axios';

const BASE_URL = 'https://us-central1-brotherhood-edc8d.cloudfunctions.net/api';

const api = axios.create({
  baseURL: BASE_URL,
});



// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('AuthToken');
    if (token) {
      config.headers['Authorization'] = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 403/401 unauthorized errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      // Don't redirect if the failing request is the login/signup endpoint itself
      const url = error.response.config && error.response.config.url;
      const isAuthEndpoint = url && (url.includes('/login') || url.includes('/signup'));
      if (!isAuthEndpoint) {
        // Clear token and redirect to login
        localStorage.removeItem('AuthToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
