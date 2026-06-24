import axios from 'axios';
import { useAuthStore } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  // Do not force Content-Type globally.
  // For FormData (multer), Axios must send multipart/form-data automatically.
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
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

    // If it's a 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refreshing fails
      if (originalRequest.url === '/api/auth/refresh' || originalRequest.url === '/api/auth/login') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const refreshSuccess = await useAuthStore.getState().refresh();
        if (refreshSuccess) {
          isRefreshing = false;
          processQueue(null, refreshSuccess);
          originalRequest.headers.Authorization = `Bearer ${refreshSuccess}`;
          return api(originalRequest);
        } else {
          isRefreshing = false;
          processQueue(new Error('Refresh failed'), null);
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
