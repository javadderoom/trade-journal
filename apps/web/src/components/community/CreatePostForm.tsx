import React, { useState } from 'react';
import styles from './CreatePostForm.module.scss';
import axios from 'axios';
import { useAuthStore } from '@/lib/auth';

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:3000/api/community/feed', { content }, { withCredentials: true });
      setContent('');
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
            <button title="Attach Trade">🔗 Attach Trade</button>
          </div>
          <button 
            className={styles.submitBtn} 
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
