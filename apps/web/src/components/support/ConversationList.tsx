'use client';

import React from 'react';
import { StatusBadge, PriorityBadge, CategoryBadge } from './StatusBadge';
import type { Conversation } from '../../store/useSupportStore';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
          color: '#94a3b8',
          opacity: 0.5,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 40 }}>forum</span>
        <span style={{ fontSize: 14 }}>هنوز تیکتی ایجاد نشده</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {conversations.map((conv) => {
        const lastMessage = conv.messages?.[0];
        const time = lastMessage
          ? new Date(lastMessage.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          : new Date(conv.created_at).toLocaleDateString('fa-IR');

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '14px 16px',
              border: 'none',
              borderBottom: '1px solid rgba(60, 74, 65, 0.25)',
              borderRadius: 0,
              background: selectedId === conv.id ? 'rgba(97, 249, 177, 0.06)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'right',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {conv.subject}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, opacity: 0.6 }}>{time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={conv.status} />
              <PriorityBadge priority={conv.priority} />
              <CategoryBadge category={conv.category} />
              {conv._count && conv._count.messages > 0 && (
                <span style={{ fontSize: 11, color: '#94a3b8', opacity: 0.6 }}>
                  {conv._count.messages} پیام
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
