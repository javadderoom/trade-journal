'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  slug: string;
  locale: string;
}

export function ViewTracker({ slug, locale }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    
    const key = `viewed_post_${slug}_${locale}`;
    if (!localStorage.getItem(key)) {
      tracked.current = true;
      
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      fetch(`${API_URL}/api/blog/posts/${slug}/view?locale=${locale}`, { method: 'POST' })
        .then(res => {
          if (res.ok) {
            localStorage.setItem(key, '1');
          }
        })
        .catch(err => console.error('Failed to track view', err));
    }
  }, [slug]);

  return null;
}
