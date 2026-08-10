import React, { useState } from 'react';
import styles from './CreatePostForm.module.scss';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useTranslation } from '@/store/useAppStore';
import { TradeSelectorModal, MinimalTrade } from './TradeSelectorModal';

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [attachedTrade, setAttachedTrade] = useState<MinimalTrade | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isFa = language === 'fa';

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5); // limit to 5
      setMediaFiles(prev => [...prev, ...files].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !attachedTrade && mediaFiles.length === 0) return;
    setIsSubmitting(true);
    try {
      let uploadedMedia: string[] = [];
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach(f => formData.append('media', f));
        const uploadRes = await api.post('/api/community/feed/upload-media', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedMedia = uploadRes.data.urls;
      }
      
      const payload = { content, isAnonymous, media: uploadedMedia, tradeId: attachedTrade?.id };

      if (attachedTrade) {
        await api.post('/api/community/feed/trade', payload);
      } else {
        await api.post('/api/community/feed', payload);
      }
      setContent('');
      setAttachedTrade(null);
      setMediaFiles([]);
      setIsAnonymous(false);
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
          placeholder={isFa ? "ایده‌ها، تحلیل‌ها یا موقعیت‌های معاملاتی خود را به اشتراک بگذارید..." : "Share your trading thoughts, analysis, or setups..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className={styles.actions}>
          <div className={styles.tools}>
            <button 
              title={isFa ? "پیوست معامله" : "Attach Trade"} 
              onClick={() => setShowModal(true)}
              style={attachedTrade ? { color: 'var(--text)', backgroundColor: 'var(--primary-container)', padding: '4px 8px', borderRadius: '4px' } : {}}
            >
              🔗 {attachedTrade ? (isFa ? `پیوست شده: ${attachedTrade.symbol}` : `Attached: ${attachedTrade.symbol}`) : (isFa ? 'پیوست معامله' : 'Attach Trade')}
            </button>
            {attachedTrade && (
              <button title={isFa ? "حذف" : "Remove"} onClick={() => setAttachedTrade(null)} style={{ color: 'var(--error)' }}>
                &times;
              </button>
            )}
            <label style={{ cursor: 'pointer', color: 'var(--primary)', marginLeft: '10px' }}>
              📷 {mediaFiles.length > 0 ? (isFa ? `${mediaFiles.length} تصویر` : `${mediaFiles.length} Images`) : (isFa ? 'افزودن تصویر' : 'Add Media')}
              <input type="file" multiple accept="image/*" onChange={handleMediaChange} style={{ display: 'none' }} />
            </label>
            {mediaFiles.length > 0 && (
              <button title={isFa ? "حذف تصویر" : "Clear Media"} onClick={() => setMediaFiles([])} style={{ color: 'var(--error)', marginLeft: '4px' }}>
                &times;
              </button>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px', fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
              {isFa ? 'ناشناس' : 'Anonymous'}
            </label>
          </div>
          <button 
            className={styles.submitBtn} 
            onClick={handleSubmit}
            disabled={(!content.trim() && !attachedTrade && mediaFiles.length === 0) || isSubmitting}
          >
            {isFa ? (isSubmitting ? 'در حال ارسال...' : 'ارسال') : (isSubmitting ? 'Posting...' : 'Post')}
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
