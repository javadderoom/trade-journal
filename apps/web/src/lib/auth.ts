import { create } from 'zustand';
import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  role: string;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNewUser: boolean; registerToken?: string }>;
  registerOtp: (registerToken: string, name: string, email: string, password: string) => Promise<void>;
}

let refreshPromise: Promise<string | null> | null = null;

const setSessionCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'refreshToken=1; path=/; max-age=2592000; SameSite=Lax';
  }
};

const clearSessionCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isInitialized: false,

  login: async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { accessToken, user } = res.data;
      set({ accessToken, user });
      setSessionCookie();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'خطا در ورود به حساب کاربری';
      throw new Error(errMsg);
    }
  },

  sendOtp: async (phone) => {
    try {
      await api.post('/api/auth/otp/send', { phone });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'خطا در ارسال کد تایید';
      throw new Error(errMsg);
    }
  },

  verifyOtp: async (phone, code) => {
    try {
      const res = await api.post('/api/auth/otp/verify', { phone, code });
      if (!res.data.isNewUser) {
        const { accessToken, user } = res.data;
        set({ accessToken, user });
        setSessionCookie();
      }
      return {
        isNewUser: res.data.isNewUser,
        registerToken: res.data.registerToken,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'کد تایید نامعتبر است';
      throw new Error(errMsg);
    }
  },

  registerOtp: async (registerToken, name, email, password) => {
    try {
      const res = await api.post('/api/auth/otp/register', { registerToken, name, email, password });
      const { accessToken, user } = res.data;
      set({ accessToken, user });
      setSessionCookie();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'خطا در تکمیل ثبت نام';
      throw new Error(errMsg);
    }
  },

  register: async (name, email, phone, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, phone, password });
      const { accessToken, user } = res.data;
      set({ accessToken, user });
      setSessionCookie();
    } catch (err: any) {
      let errMsg = err.response?.data?.error || 'خطا در ثبت نام کاربر';
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        const messages: string[] = [];
        Object.keys(details).forEach((field) => {
          if (Array.isArray(details[field])) {
            messages.push(...details[field]);
          }
        });
        if (messages.length > 0) {
          errMsg = messages.join('\n');
        }
      }
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed:', err);
    } finally {
      set({ user: null, accessToken: null });
      clearSessionCookie();
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAuthPage = path.includes('/login') || path.includes('/register');
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
    }
  },

  refresh: async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const res = await api.post('/api/auth/refresh');
        const { accessToken, user } = res.data;
        set({ accessToken, user });
        setSessionCookie();
        return accessToken;
      } catch (err) {
        set({ user: null, accessToken: null });
        clearSessionCookie();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  initialize: async () => {
    if (get().isInitialized) return;
    try {
      await get().refresh();
    } catch (err) {
      console.log('Not authenticated on startup');
    } finally {
      set({ isInitialized: true });
    }
  },
}));
