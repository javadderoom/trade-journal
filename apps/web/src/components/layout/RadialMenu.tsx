'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../../store/useAppStore';

export interface RadialMenuItem {
  href: string;
  label: string;
  icon: string;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  open: boolean;
  onClose: () => void;
}

export default function RadialMenu({ items, open, onClose }: RadialMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="radial-menu-overlay" onClick={onClose}>
      <div
        ref={menuRef}
        className="radial-menu"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`radial-menu-item ${isActive ? 'active' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={onClose}
            >
              <div className="radial-menu-icon-wrapper">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                >
                  {item.icon}
                </span>
              </div>
              <span className="radial-menu-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
