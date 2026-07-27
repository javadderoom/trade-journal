'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../store/useAppStore';
import './loading-button.scss';

export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<any> | void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  successText?: string;
  errorText?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  autoResetDelay?: number;
}

export default function LoadingButton({
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  style = {},
  disabled = false,
  children,
  successText,
  errorText,
  isLoading: controlledLoading,
  isSuccess: controlledSuccess,
  isError: controlledError,
  autoResetDelay = 2200,
  ...rest
}: LoadingButtonProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [status, setStatus] = useState<ButtonStatus>('idle');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevLoadingRef = useRef<boolean | undefined>(controlledLoading);
  const loadingStartTimeRef = useRef<number | null>(null);

  const defaultSuccessText = successText ?? (isEn ? 'Done!' : 'ذخیره شد');
  const defaultErrorText = errorText ?? (isEn ? 'Failed' : 'خطا');

  // Sync controlled state (e.g. isLoading={isSubmitting})
  useEffect(() => {
    if (controlledLoading !== undefined) {
      const wasLoading = prevLoadingRef.current;
      prevLoadingRef.current = controlledLoading;

      if (controlledLoading) {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        loadingStartTimeRef.current = Date.now();
        setStatus('loading');
      } else if (wasLoading) {
        const elapsed = loadingStartTimeRef.current ? Date.now() - loadingStartTimeRef.current : 500;
        const remaining = Math.max(0, 500 - elapsed);

        setTimeout(() => {
          if (controlledError) {
            setStatus('error');
          } else {
            setStatus('success');
          }
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = setTimeout(() => {
            setStatus('idle');
          }, autoResetDelay);
        }, remaining);
      } else if (controlledSuccess) {
        setStatus('success');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setStatus('idle'), autoResetDelay);
      } else if (controlledError) {
        setStatus('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setStatus('idle'), autoResetDelay);
      }
    }
  }, [controlledLoading, controlledSuccess, controlledError, autoResetDelay]);

  // Clean up auto-reset timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || status !== 'idle') return;
    if (!onClick) return;

    try {
      loadingStartTimeRef.current = Date.now();
      setStatus('loading');

      const result = onClick(e);

      if (result && typeof (result as any).then === 'function') {
        await result;
      }

      const elapsed = loadingStartTimeRef.current ? Date.now() - loadingStartTimeRef.current : 500;
      const remaining = Math.max(0, 500 - elapsed);

      setTimeout(() => {
        setStatus('success');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setStatus('idle'), autoResetDelay);
      }, remaining);
    } catch (err) {
      const elapsed = loadingStartTimeRef.current ? Date.now() - loadingStartTimeRef.current : 500;
      const remaining = Math.max(0, 500 - elapsed);

      setTimeout(() => {
        setStatus('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => setStatus('idle'), autoResetDelay);
      }, remaining);
    }
  };

  const statusClass = `btn-${status}-state`;
  const sizeClass = `btn-size-${size}`;
  const variantClass = `btn-var-${variant}`;

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`loading-btn ${variantClass} ${sizeClass} ${statusClass} ${className}`}
      disabled={disabled || status === 'loading'}
      onClick={handleClick}
      style={style}
      {...rest}
    >
      {/* State 1: IDLE */}
      {status === 'idle' && (
        <span className="btn-label-idle">
          {children}
        </span>
      )}

      {/* State 2: LOADING */}
      {status === 'loading' && (
        <span className="btn-spinner-wrap">
          <span className="btn-mini-spinner" />
        </span>
      )}

      {/* State 3: SUCCESS */}
      {status === 'success' && (
        <span className="btn-status-content btn-success-content">
          <span className="material-symbols-outlined status-icon">check</span>
          <span>{defaultSuccessText}</span>
        </span>
      )}

      {/* State 4: ERROR */}
      {status === 'error' && (
        <span className="btn-status-content btn-error-content">
          <span className="material-symbols-outlined status-icon">error</span>
          <span>{defaultErrorText}</span>
        </span>
      )}
    </button>
  );
}
