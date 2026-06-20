'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  title?: string;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  title,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder ?? '';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!open) {
            setOpen(true);
            setFocusedIndex(options.findIndex(o => o.value === value));
          } else if (focusedIndex >= 0) {
            onChange(options[focusedIndex].value);
            setOpen(false);
            setFocusedIndex(-1);
          }
          break;
        case 'Escape':
          setOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!open) { setOpen(true); setFocusedIndex(0); }
          else setFocusedIndex(i => Math.min(i + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) { setOpen(true); setFocusedIndex(options.length - 1); }
          else setFocusedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Tab':
          setOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [open, focusedIndex, options, onChange, value]
  );

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    setFocusedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select ${open ? 'is-open' : ''} ${className}`}
      title={title}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => {
        if (!open) setFocusedIndex(options.findIndex(o => o.value === value));
        setOpen(prev => !prev);
      }}
    >
      {/* Trigger */}
      <div className="cs-trigger">
        {/*
          cs-label-area: takes the width of the widest option (via the invisible
          sizer stack) so the trigger never reflows when the selected item changes.
        */}
        <span className="cs-label-area">
          <span className="cs-sizer" aria-hidden="true">
            {options.map(o => <span key={o.value}>{o.label}</span>)}
          </span>
          <span className="cs-label">{displayLabel}</span>
        </span>
        <span className={`cs-chevron material-symbols-outlined ${open ? 'rotated' : ''}`}>
          keyboard_arrow_down
        </span>
      </div>

      {/* Dropdown list */}
      <ul
        ref={listRef}
        className={`cs-dropdown ${open ? 'cs-dropdown--visible' : ''}`}
        role="listbox"
        aria-label={title}
      >
        {options.map((opt, idx) => {
          const isSelected = opt.value === value;
          const isFocused = idx === focusedIndex;
          return (
            <li
              key={opt.value}
              role="option"
              aria-selected={isSelected}
              className={`cs-option ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}`}
              onMouseEnter={() => setFocusedIndex(idx)}
              onMouseDown={e => { e.preventDefault(); handleSelect(opt.value); }}
            >
              {isSelected && (
                <span className="cs-check material-symbols-outlined">check</span>
              )}
              <span className="cs-option-label">{opt.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
