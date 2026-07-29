'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';
import './AnnouncementBanner.scss';

interface BannerConfig {
  isActive: boolean;
  textFa: string;
  textEn: string;
  link?: string;
}

export default function AnnouncementBanner() {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(true); // Default true to avoid flash before check
  const pathname = usePathname() || '';
  
  const isEn = pathname.startsWith('/en');

  useEffect(() => {
    // Check if dismissed
    const dismissedStr = localStorage.getItem('announcement_banner_dismissed');
    
    api.get('/api/settings/announcement-banner')
      .then(res => {
        const data = res.data;
        setConfig(data);
        // If data changes or isn't dismissed, we show it
        const bannerKey = data.textFa || data.textEn;
        if (data.isActive && dismissedStr !== bannerKey) {
          setIsDismissed(false);
        }
      })
      .catch(err => console.error('Failed to fetch banner config', err));
  }, []);

  if (!config || !config.isActive || isDismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    const bannerKey = config.textFa || config.textEn;
    if (bannerKey) {
      localStorage.setItem('announcement_banner_dismissed', bannerKey);
    }
  };

  const text = isEn ? config.textEn : config.textFa;
  if (!text) return null;

  const content = (
    <div className={`announcement-banner ${isEn ? 'ltr' : 'rtl'}`}>
      <div className="banner-content">
        <span>{text}</span>
      </div>
      <button className="banner-close" onClick={handleDismiss} aria-label="Close banner">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );

  if (config.link) {
    return (
      <a href={config.link} className="announcement-banner-link">
        {content}
      </a>
    );
  }

  return content;
}
