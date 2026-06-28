import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface NotificationState {
  toasts: Toast[];
  confirmPromise: { resolve: (value: boolean) => void; config: ConfirmConfig } | null;
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  confirm: (config: ConfirmConfig) => Promise<boolean>;
  resolveConfirm: (value: boolean) => void;
}

let toastCounter = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  confirmPromise: null,

  addToast: (type, message, duration = 3000) => {
    const id = `toast-${++toastCounter}`;
    const toast: Toast = { id, type, message, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  confirm: (config) => {
    return new Promise<boolean>((resolve) => {
      set({ confirmPromise: { resolve, config } });
    });
  },

  resolveConfirm: (value) => {
    set((state) => {
      state.confirmPromise?.resolve(value);
      return { confirmPromise: null };
    });
  },
}));
