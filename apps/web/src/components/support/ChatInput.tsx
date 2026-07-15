'use client';

import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSend: (body: string, attachments?: File[]) => Promise<void>;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, sending, disabled, placeholder }: ChatInputProps) {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if ((!body.trim() && files.length === 0) || sending) return;
    try {
      await onSend(body.trim(), files.length > 0 ? files : undefined);
      setBody('');
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 3));
    }
  };

  return (
    <div>
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px 0', flexWrap: 'wrap' }}>
          {files.map((f, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(97, 249, 177, 0.1)',
                color: '#61f9b1',
                fontSize: 12,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>attach_file</span>
              {f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name}
              <button
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid rgba(60, 74, 65, 0.3)',
          background: '#191b22',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>attach_file</span>
        </button>
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'پیام خود را بنویسید...'}
          disabled={disabled}
          style={{
            flex: 1,
            background: '#1e1f26',
            border: '1px solid rgba(60, 74, 65, 0.4)',
            borderRadius: 12,
            padding: '10px 14px',
            color: '#e2e2eb',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || (!body.trim() && files.length === 0)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: '#61f9b1',
            color: '#003822',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending || (!body.trim() && files.length === 0) ? 0.4 : 1,
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </button>
      </div>
    </div>
  );
}
