'use client';

import React, { useEffect, useState } from 'react';
import { useSupportStore, Conversation } from '../../../store/useSupportStore';
import { useTranslation } from '../../../store/useAppStore';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../../components/support/StatusBadge';
import MessageBubble from '../../../components/support/MessageBubble';
import ChatInput from '../../../components/support/ChatInput';
import { useAuthStore } from '../../../lib/auth';
import '../../../components/support/support-components.scss';

type View = 'list' | 'detail';
type StatusFilter = 'ALL' | 'OPEN' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export default function AdminSupportPage() {
  const { t, language } = useTranslation();
  const {
    conversations, stats, messages, activeConversation,
    adminFetchConversations, adminFetchStats, adminFetchConversation,
    adminReply, adminAssign, adminChangeStatus, adminChangePriority, sending,
  } = useSupportStore();
  const user = useAuthStore((s) => s.user);

  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: t('support.all') },
    { value: 'OPEN', label: t('support.statusOpen') },
    { value: 'WAITING', label: t('support.statusWaiting') },
    { value: 'RESOLVED', label: t('support.statusResolved') },
    { value: 'CLOSED', label: t('support.statusClosed') },
  ];

  useEffect(() => {
    adminFetchStats();
    adminFetchConversations();
  }, [adminFetchStats, adminFetchConversations]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setView('detail');
    await adminFetchConversation(id);
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
    adminFetchConversations(statusFilter !== 'ALL' ? { status: statusFilter } : undefined);
    adminFetchStats();
  };

  const handleFilterChange = async (filter: StatusFilter) => {
    setStatusFilter(filter);
    const params = filter !== 'ALL' ? { status: filter } : undefined;
    await adminFetchConversations(params);
  };

  const handleReply = async (body: string, attachments?: File[]) => {
    if (selectedId) {
      await adminReply(selectedId, body, attachments);
      await adminFetchConversation(selectedId);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.subject.toLowerCase().includes(q) ||
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-support-page">
      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="admin-support-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e2e2eb', margin: 0 }}>{t('support.title')}</h1>
            </div>

            {/* Stats */}
            {stats && (
              <div className="admin-support-stats">
                {[
                  { label: t('support.statusOpen'), value: stats.open, color: '#3ddc97' },
                  { label: t('support.statusWaiting'), value: stats.waiting, color: '#f59e0b' },
                  { label: t('support.statusResolved'), value: stats.resolved, color: '#60a5fa' },
                  { label: t('support.statusClosed'), value: stats.closed, color: '#94a3b8' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(60, 74, 65, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}:</span>{' '}
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="admin-support-filters">
              <div className="admin-support-filter-buttons">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFilterChange(opt.value)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 7,
                      border: `1px solid ${statusFilter === opt.value ? '#61f9b1' : 'rgba(60, 74, 65, 0.3)'}`,
                      background: statusFilter === opt.value ? 'rgba(97, 249, 177, 0.1)' : 'transparent',
                      color: statusFilter === opt.value ? '#61f9b1' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: statusFilter === opt.value ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('support.search')}
                className="admin-support-search"
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(60, 74, 65, 0.3)',
                  background: '#1e1f26',
                  color: '#e2e2eb',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="admin-support-list">
            {filteredConversations.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', opacity: 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40 }}>forum</span>
                <span style={{ fontSize: 14, marginTop: 8 }}>{t('support.noResults')}</span>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '14px 20px',
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid rgba(60, 74, 65, 0.2)',
                    borderRadius: 0,
                    background: selectedId === conv.id ? 'rgba(97, 249, 177, 0.06)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {conv.subject}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, opacity: 0.6 }}>
                      {new Date(conv.created_at).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <StatusBadge status={conv.status} />
                    <PriorityBadge priority={conv.priority} />
                    <CategoryBadge category={conv.category} />
                    {conv.user && (
                      <span style={{ fontSize: 11, color: '#94a3b8', opacity: 0.6 }}>
                        {conv.user.name || conv.user.email}
                      </span>
                    )}
                    {conv._count && (
                      <span style={{ fontSize: 11, color: '#94a3b8', opacity: 0.6 }}>
                        {conv._count.messages} {t('support.messageCount')}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* Detail View */
        <div className="admin-support-detail">
          {/* Header */}
          <div className="admin-support-detail-header">
            <button
              onClick={handleBack}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                {activeConversation?.subject}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {activeConversation && <StatusBadge status={activeConversation.status} />}
                {activeConversation && <PriorityBadge priority={activeConversation.priority} />}
                {activeConversation && <CategoryBadge category={activeConversation.category} />}
              </div>
            </div>
          </div>

          {/* Controls */}
          {activeConversation && (
            <div className="admin-support-controls">
              <select
                value={activeConversation.status}
                onChange={(e) => adminChangeStatus(activeConversation.id, e.target.value)}
                style={{
                  padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(60, 74, 65, 0.3)',
                  background: '#1e1f26', color: '#e2e2eb', fontSize: 12, cursor: 'pointer',
                }}
              >
                <option value="OPEN">{t('support.statusOpen')}</option>
                <option value="WAITING">{t('support.statusWaiting')}</option>
                <option value="RESOLVED">{t('support.statusResolved')}</option>
                <option value="CLOSED">{t('support.statusClosed')}</option>
              </select>
              <select
                value={activeConversation.priority}
                onChange={(e) => adminChangePriority(activeConversation.id, e.target.value)}
                style={{
                  padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(60, 74, 65, 0.3)',
                  background: '#1e1f26', color: '#e2e2eb', fontSize: 12, cursor: 'pointer',
                }}
              >
                <option value="LOW">{t('support.priorityLow')}</option>
                <option value="NORMAL">{t('support.priorityNormal')}</option>
                <option value="HIGH">{t('support.priorityHigh')}</option>
                <option value="URGENT">{t('support.priorityUrgent')}</option>
              </select>
              {activeConversation.user && (
                <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                  {activeConversation.user.name || activeConversation.user.email}
                </span>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="admin-support-messages">
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
          </div>

          {/* Input */}
          {(activeConversation?.status === 'OPEN' || activeConversation?.status === 'WAITING') ? (
            <ChatInput onSend={handleReply} sending={sending} placeholder={t('support.replyPlaceholder')} />
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: 13, borderTop: '1px solid rgba(60, 74, 65, 0.3)' }}>
              {t('support.ticketClosed')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
