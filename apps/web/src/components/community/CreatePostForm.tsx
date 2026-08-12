import React, { useState, useRef, useEffect } from 'react';
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5); // limit to 5
      setMediaFiles(prev => [...prev, ...files].slice(0, 5));
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
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
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
          ref={textareaRef}
          className={styles.textarea}
          placeholder={isFa ? "ایده‌ها، تحلیل‌ها یا موقعیت‌های معاملاتی خود را به اشتراک بگذارید..." : "Share your trading thoughts, analysis, or setups..."}
          value={content}
          onChange={handleInput}
          rows={1}
        />
        
        {(attachedTrade || mediaFiles.length > 0) && (
          <div className={styles.previewArea}>
            {attachedTrade && (
              <div className={styles.previewPill}>
                <span className="material-symbols-outlined">analytics</span>
                <span>{attachedTrade.symbol}</span>
                <button title={isFa ? "حذف" : "Remove"} onClick={() => setAttachedTrade(null)}>&times;</button>
              </div>
            )}
            {mediaFiles.length > 0 && (
              <div className={styles.previewPill}>
                <span className="material-symbols-outlined">image</span>
                <span>{isFa ? `${mediaFiles.length} فایل` : `${mediaFiles.length} files`}</span>
                <button title={isFa ? "حذف" : "Remove"} onClick={() => setMediaFiles([])}>&times;</button>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <div className={styles.tools}>
            <button 
              title={isFa ? "پیوست معامله" : "Attach Trade"} 
              onClick={() => setShowModal(true)}
              className={attachedTrade ? styles.toolActive : styles.toolBtn}
            >
              <span className="material-symbols-outlined">analytics</span>
            </button>
            
            <label className={styles.toolBtn} title={isFa ? 'افزودن مدیا' : 'Add Media'}>
              <span className="material-symbols-outlined">image</span>
              <input type="file" multiple accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleMediaChange} style={{ display: 'none' }} />
            </label>

            <button 
              className={isAnonymous ? styles.toolActive : styles.toolBtn}
              onClick={() => setIsAnonymous(!isAnonymous)}
              title={isFa ? 'ارسال ناشناس' : 'Post Anonymously'}
            >
              <span className="material-symbols-outlined">{isAnonymous ? 'visibility_off' : 'visibility'}</span>
            </button>
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
