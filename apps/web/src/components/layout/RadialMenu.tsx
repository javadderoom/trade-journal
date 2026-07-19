'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface RadialMenuItem {
  href?: string;
  label: string;
  icon: string;
  onClick?: () => void;
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

  const totalItems = items.length;
  const arcSpread = 160;
  const startAngle = -arcSpread / 2;
  const angleStep = totalItems > 1 ? arcSpread / (totalItems - 1) : 0;

  return (
    <div className="radial-menu-overlay" onClick={onClose}>
      <div
        ref={menuRef}
        className="radial-menu-container"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, i) => {
          const isActive = !!item.href && pathname === item.href;
          const angle = totalItems === 1 ? 0 : startAngle + i * angleStep;
          const sharedProps = {
            className: `radial-menu-item ${isActive ? 'active' : ''}`,
            style: {
              '--item-angle': `${angle}deg`,
              '--item-delay': `${i * 60}ms`,
            } as React.CSSProperties,
          };

          const inner = (
            <>
              <div className="radial-menu-icon-wrapper">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                >
                  {item.icon}
                </span>
              </div>
              <span className="radial-menu-label">{item.label}</span>
            </>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                {...sharedProps}
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              {...sharedProps}
              onClick={onClose}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
