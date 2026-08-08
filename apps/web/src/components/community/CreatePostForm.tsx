import React, { useState } from 'react';
import styles from './CreatePostForm.module.scss';
import axios from 'axios';
import { useAuthStore } from '@/lib/auth';
import { TradeSelectorModal, MinimalTrade } from './TradeSelectorModal';

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [attachedTrade, setAttachedTrade] = useState<MinimalTrade | null>(null);
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!content.trim() && !attachedTrade) return;
    setIsSubmitting(true);
    try {
      if (attachedTrade) {
        await axios.post('http://localhost:3000/api/community/feed/trade', { 
          content,
          tradeId: attachedTrade.id 
        }, { withCredentials: true });
      } else {
        await axios.post('http://localhost:3000/api/community/feed', { content }, { withCredentials: true });
      }
      setContent('');
      setAttachedTrade(null);
      onPostCreated();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.avatar}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontWeight: 'bold' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder="Share your trading thoughts, analysis, or setups..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className={styles.actions}>
          <div className={styles.tools}>
            <button 
              title="Attach Trade" 
              onClick={() => setShowModal(true)}
              style={attachedTrade ? { color: 'var(--text)', backgroundColor: 'var(--primary-container)', padding: '4px 8px', borderRadius: '4px' } : {}}
            >
              🔗 {attachedTrade ? `Attached: ${attachedTrade.symbol}` : 'Attach Trade'}
            </button>
            {attachedTrade && (
              <button title="Remove" onClick={() => setAttachedTrade(null)} style={{ color: 'var(--error)' }}>
                &times;
              </button>
            )}
          </div>
          <button 
            className={styles.submitBtn} 
            onClick={handleSubmit}
            disabled={(!content.trim() && !attachedTrade) || isSubmitting}
          >
            Post
          </button>
        </div>
      </div>

      {showModal && (
        <TradeSelectorModal 
          onClose={() => setShowModal(false)} 
          onSelect={(trade) => {
            setAttachedTrade(trade);
            setShowModal(false);
          }} 
        />
      )}
    </div>
  );
}
