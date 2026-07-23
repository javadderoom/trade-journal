'use client';

import React from 'react';
import { useTranslation } from '../../store/useAppStore';

interface PageLoaderProps {
  label?: string;
  fullScreen?: boolean;
  minHeight?: string;
}

export default function PageLoader({
  label,
  fullScreen = true,
  minHeight = '60vh',
}: PageLoaderProps) {
  const { language } = useTranslation();

  const displayLabel =
    label ?? (language === 'en' ? 'Loading...' : 'در حال دریافت...');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        width: '100%',
        minHeight: fullScreen ? minHeight : 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div className="dash-spinner" />
      <p
        style={{
          color: '#94a3b8',
          fontSize: '14px',
          fontFamily: language === 'en' ? 'Inter, sans-serif' : 'Vazirmatn, sans-serif',
          fontWeight: 500,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {displayLabel}
      </p>
    </div>
  );
}
