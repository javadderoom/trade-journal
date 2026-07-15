'use client';

import React, { useEffect, useRef } from 'react';
import { useSupportStore, Conversation } from '../../store/useSupportStore';
import { StatusBadge, PriorityBadge, CategoryBadge } from './StatusBadge';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useAuthStore } from '../../lib/auth';

interface ConversationDetailProps {
  conversationId: string;
  onBack: () => void;
}

export default function ConversationDetail({ conversationId, onBack }: ConversationDetailProps) {
  const { activeConversation: conversation, messages, sendMessage, fetchConversation, closeConversation, sending } =
    useSupportStore();
  const user = useAuthStore((s) => s.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation(conversationId);
    const interval = setInterval(() => fetchConversation(conversationId), 10000);
    return () => clearInterval(interval);
  }, [conversationId, fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (body: string, attachments?: File[]) => {
    await sendMessage(conversationId, body, attachments);
  };

  const handleClose = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این تیکت را ببندید؟')) {
      await closeConversation(conversationId);
    }
  };

  if (!conversation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
        در حال بارگذاری...
      </div>
    );
  }

  const isActive = conversation.status === 'OPEN' || conversation.status === 'WAITING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(60, 74, 65, 0.3)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
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
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conversation.subject}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <StatusBadge status={conversation.status} />
            <PriorityBadge priority={conversation.priority} />
            <CategoryBadge category={conversation.category} />
          </div>
        </div>
        {isActive && (
          <button
            onClick={handleClose}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            بستن تیکت
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px',
        }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            senderId={msg.sender_id}
            body={msg.body}
            attachments={msg.attachments}
            timestamp={msg.created_at}
            isOwn={msg.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isActive ? (
        <ChatInput
          onSend={handleSend}
          sending={sending}
          placeholder="پاسخ خود را بنویسید..."
        />
      ) : (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 13,
            borderTop: '1px solid rgba(60, 74, 65, 0.3)',
          }}
        >
          این تیکت بسته شده است
        </div>
      )}
    </div>
  );
}
