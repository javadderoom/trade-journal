'use client';

import React from 'react';
import { useAuthStore } from '../../lib/auth';

interface MessageBubbleProps {
  senderId: string;
  body: string;
  attachments?: string[];
  timestamp: string;
  isOwn: boolean;
}

export default function MessageBubble({ senderId, body, attachments, timestamp, isOwn }: MessageBubbleProps) {
  const user = useAuthStore((s) => s.user);
  const time = new Date(timestamp).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        alignSelf: isOwn ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '16px',
          fontSize: '14px',
          lineHeight: 1.5,
          color: isOwn ? '#003822' : '#e2e2eb',
          background: isOwn
            ? 'linear-gradient(135deg, #61f9b1, #3ddc97)'
            : '#282a30',
          borderBottomRightRadius: isOwn ? '4px' : '16px',
          borderBottomLeftRadius: isOwn ? '16px' : '4px',
          wordBreak: 'break-word',
        }}
      >
        {body}
        {attachments && attachments.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {attachments.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.1)',
                  color: isOwn ? '#003822' : '#94a3b8',
                  fontSize: 12,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  attach_file
                </span>
                فایل پیوست
              </a>
            ))}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: '11px',
          color: '#94a3b8',
          opacity: 0.6,
          marginTop: 4,
          padding: '0 4px',
        }}
      >
        {time}
      </span>
    </div>
  );
}
