'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  autoResetDelay = 1500,
  ...rest
}: LoadingButtonProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [status, setStatus] = useState<ButtonStatus>('idle');
  const [btnWidth, setBtnWidth] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync controlled state if passed
  useEffect(() => {
    if (controlledLoading !== undefined) {
      if (controlledLoading) setStatus('loading');
      else if (controlledSuccess) setStatus('success');
      else if (controlledError) setStatus('error');
      else setStatus('idle');
    }
  }, [controlledLoading, controlledSuccess, controlledError]);

  // Capture initial button width for smooth morphing back & forth
  useEffect(() => {
    if (buttonRef.current && status === 'idle') {
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setBtnWidth(rect.width);
      }
    }
  }, [children, status]);

  // Clean up auto-reset timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const triggerReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setStatus('idle');
    }, autoResetDelay);
  }, [autoResetDelay]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || status !== 'idle') return;

    if (!onClick) return;

    try {
      const result = onClick(e);

      // Check if return value is a Promise
      if (result && typeof (result as any).then === 'function') {
        setStatus('loading');
        await result;
        setStatus('success');
        triggerReset();
      }
    } catch (err) {
      setStatus('error');
      triggerReset();
    }
  };

  const defaultSuccessText = successText ?? (isEn ? 'Done!' : 'ذخیره شد ✅');
  const defaultErrorText = errorText ?? (isEn ? 'Failed' : 'خطا ❌');

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
      style={{
        ...(btnWidth && status === 'idle' ? { minWidth: `${btnWidth}px` } : {}),
        ...style,
      }}
      {...rest}
    >
      {/* State 1: IDLE */}
      <span className={`btn-label-idle ${status === 'idle' ? 'visible' : 'hidden'}`}>
        {children}
      </span>

      {/* State 2: LOADING (Mini Spinner inside Collapsed Circle) */}
      {status === 'loading' && (
        <span className="btn-spinner-wrap">
          <span className="btn-mini-spinner" />
        </span>
      )}

      {/* State 3: SUCCESS (Expanded + Checkmark + Done Text) */}
      {status === 'success' && (
        <span className="btn-status-content btn-success-content">
          <span className="material-symbols-outlined status-icon">check</span>
          <span>{defaultSuccessText}</span>
        </span>
      )}

      {/* State 4: ERROR (Expanded + Error Icon + Alert Text) */}
      {status === 'error' && (
        <span className="btn-status-content btn-error-content">
          <span className="material-symbols-outlined status-icon">error</span>
          <span>{defaultErrorText}</span>
        </span>
      )}
    </button>
  );
}
