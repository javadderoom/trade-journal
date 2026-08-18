import React from 'react';

interface ConceptIconProps {
  icon?: string | null;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

export default function ConceptIcon({ icon, className = '', size = 14, style = {} }: ConceptIconProps) {
  if (!icon || !icon.trim()) return null;

  const trimmed = icon.trim();
  // If the icon is an alphanumeric Material Symbols name (e.g. "open_in_new", "trending_up", "bolt")
  const isMaterialIcon = /^[a-z0-9_]+$/i.test(trimmed);

  if (isMaterialIcon) {
    return (
      <span
        className={`material-symbols-outlined ${className}`}
        style={{
          fontSize: typeof size === 'number' ? `${size}px` : size,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          ...style,
        }}
      >
        {trimmed}
      </span>
    );
  }

  // It's a Unicode emoji (e.g. 🎯, ⚡, 📈)
  return (
    <span
      className={className}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {trimmed}
    </span>
  );
}
