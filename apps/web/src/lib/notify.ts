import { useNotificationStore, ConfirmConfig } from '../store/useNotificationStore';

export const notify = {
  success: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast('success', message, duration);
  },
  error: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast('error', message, duration);
  },
  info: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast('info', message, duration);
  },
  warning: (message: string, duration?: number) => {
    useNotificationStore.getState().addToast('warning', message, duration);
  },
  confirm: (config: ConfirmConfig): Promise<boolean> => {
    return useNotificationStore.getState().confirm(config);
  },
};
