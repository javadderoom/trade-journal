'use client';

import React, { useState, useEffect } from 'react';
import { useSupportStore } from '../../store/useSupportStore';
import { useTranslation } from '../../store/useAppStore';
import ConversationList from '../../components/support/ConversationList';
import ConversationDetail from '../../components/support/ConversationDetail';
import NewConversationModal from '../../components/support/NewConversationModal';
import '../../components/support/support-components.scss';

type View = 'list' | 'detail';

export default function SupportPage() {
  const { t } = useTranslation();
  const { conversations, fetchConversations, createConversation } = useSupportStore();
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
  };

  const handleCreate = async (subject: string, category: string, body: string) => {
    const conv = await createConversation(subject, category, body);
    setSelectedId(conv.id);
    setView('detail');
  };

  return (
    <div className="support-page">
      {view === 'list' ? (
        <>
          <header className="support-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1>{t('support.title')}</h1>
              <button
                onClick={() => setShowNewModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#61f9b1',
                  color: '#003822',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                {t('support.newTicket')}
              </button>
            </div>
          </header>
          <div className="support-list">
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </>
      ) : (
        <div className="support-detail">
          {selectedId && <ConversationDetail conversationId={selectedId} onBack={handleBack} />}
        </div>
      )}

      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
