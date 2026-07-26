'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Dynamically sets <link rel="canonical"> based on the current pathname.
 * Replaces the broken static canonical that pointed every page to "/".
 *
 * During SSR, usePathname() returns the real path, so the initial HTML
 * already contains the correct canonical. The useEffect handles
 * client-side SPA navigations.
 */
export default function CanonicalTag() {
  const pathname = usePathname();
  const [canonical, setCanonical] = useState('');

  useEffect(() => {
    // /fa is the default locale and maps to /
    const canonicalPath = pathname === '/fa' ? '/' : pathname;
    const href = `https://tradekav.ir${canonicalPath}`;
    setCanonical(href);

    // Ensure exactly one canonical tag exists
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [pathname]);

  // During SSR, render the correct canonical immediately
  if (!canonical) {
    const canonicalPath = pathname === '/fa' ? '/' : pathname;
    return (
      <link rel="canonical" href={`https://tradekav.ir${canonicalPath}`} />
    );
  }

  return null; // Client-side updates are handled via useEffect DOM manipulation
}
