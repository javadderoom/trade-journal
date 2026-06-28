'use client';

import React, { useEffect, useCallback } from 'react';
import { useNotificationStore, Toast, ToastType } from '../../store/useNotificationStore';
import './toaster.scss';

const ICON_MAP: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={`toast-item toast-${toast.type}`} onClick={() => onDismiss(toast.id)}>
      <span className="material-symbols-outlined toast-icon">{ICON_MAP[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

export default function Toaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  const confirmPromise = useNotificationStore((s) => s.confirmPromise);
  const removeToast = useNotificationStore((s) => s.removeToast);
  const resolveConfirm = useNotificationStore((s) => s.resolveConfirm);

  const handleDismiss = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && confirmPromise) {
      resolveConfirm(false);
    }
  }, [confirmPromise, resolveConfirm]);

  useEffect(() => {
    if (confirmPromise) {
      const handler = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') {
          resolveConfirm(false);
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [confirmPromise, resolveConfirm]);

  return (
    <>
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toaster-container" dir="rtl">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmPromise && (
        <div className="toaster-overlay" onClick={() => resolveConfirm(false)} onKeyDown={handleKeyDown}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <span className="material-symbols-outlined confirm-icon">help</span>
              <h3>{confirmPromise.config.title}</h3>
            </div>
            <div className="confirm-body">
              <p>{confirmPromise.config.message}</p>
            </div>
            <div className="confirm-footer">
              <button className="confirm-btn cancel" onClick={() => resolveConfirm(false)}>
                {confirmPromise.config.cancelLabel || 'انصراف'}
              </button>
              <button
                className={`confirm-btn confirm ${confirmPromise.config.danger ? 'danger' : ''}`}
                onClick={() => resolveConfirm(true)}
              >
                {confirmPromise.config.confirmLabel || 'تایید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
