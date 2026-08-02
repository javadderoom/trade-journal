import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, HTMLMotionProps } from 'framer-motion';
import { useTranslation } from '../../store/useAppStore';
import './loading-button.scss';

export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingButtonProps extends Omit<HTMLMotionProps<'button'>, 'onClick'> {
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

  const [initialWidth, setInitialWidth] = useState<number | null>(null);

  // Keep track of the button's auto-layout width when idle
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const updateWidth = () => {
      if (status === 'idle' && button.querySelector('.btn-label-idle')) {
        const originalWidthStyle = button.style.width;
        button.style.width = '';
        const naturalWidth = button.getBoundingClientRect().width;
        button.style.width = originalWidthStyle;
        setInitialWidth(naturalWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(button);

    return () => {
      resizeObserver.disconnect();
    };
  }, [status, children]);

  // Get the circle size for the current button size variant
  const getCircleSize = () => {
    if (size === 'sm') return 34;
    if (size === 'lg') return 48;
    return 42; // md
  };

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

  // Clean up timers on unmount
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
        resetTimerRef.current = setTimeout(() => {
          setStatus('idle');
        }, autoResetDelay);
      }, remaining);
    } catch (err) {
      const elapsed = loadingStartTimeRef.current ? Date.now() - loadingStartTimeRef.current : 500;
      const remaining = Math.max(0, 500 - elapsed);

      setTimeout(() => {
        setStatus('error');
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          setStatus('idle');
        }, autoResetDelay);
      }, remaining);
    }
  };

  const statusClass = `btn-${status}-state`;
  const sizeClass = `btn-size-${size}`;
  const variantClass = `btn-var-${variant}`;

  return (
    <motion.button
      ref={buttonRef as any}
      type={type}
      className={`loading-btn ${variantClass} ${sizeClass} ${statusClass} ${className}`}
      disabled={disabled || status === 'loading'}
      onClick={handleClick as any}
      style={{
        ...style,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
      animate={
        status === 'loading'
          ? {
              width: getCircleSize(),
              borderRadius: size === 'sm' ? '17px' : size === 'lg' ? '24px' : '21px',
              paddingLeft: '0px',
              paddingRight: '0px',
            }
          : status === 'idle'
          ? {
              width: initialWidth !== null ? initialWidth : '',
              borderRadius: '8px',
              paddingLeft: size === 'sm' ? '14px' : size === 'lg' ? '28px' : '20px',
              paddingRight: size === 'sm' ? '14px' : size === 'lg' ? '28px' : '20px',
              transitionEnd: {
                width: '',
              },
            }
          : {
              width: 'auto',
              borderRadius: '8px',
              paddingLeft: size === 'sm' ? '14px' : size === 'lg' ? '28px' : '20px',
              paddingRight: size === 'sm' ? '14px' : size === 'lg' ? '28px' : '20px',
            }
      }
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === 'idle' && (
          <motion.span
            key="idle"
            className="btn-label-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.span>
        )}

        {status === 'loading' && (
          <motion.span
            key="loading"
            className="btn-spinner-wrap"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <span className="btn-mini-spinner" />
          </motion.span>
        )}

        {status === 'success' && (
          <motion.span
            key="success"
            className="btn-status-content btn-success-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="material-symbols-outlined status-icon">check</span>
            <span>{defaultSuccessText}</span>
          </motion.span>
        )}

        {status === 'error' && (
          <motion.span
            key="error"
            className="btn-status-content btn-error-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="material-symbols-outlined status-icon">error</span>
            <span>{defaultErrorText}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
