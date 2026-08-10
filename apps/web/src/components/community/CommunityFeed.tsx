'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import styles from './CommunityFeed.module.scss';
import { useTranslation } from '@/store/useAppStore';
import { CommunityPostCard, PostProps } from './CommunityPostCard';
import { CreatePostForm } from './CreatePostForm';
import { useAuthStore } from '@/lib/auth';
import { fetcher } from '@/lib/api';

export function CommunityFeed({ defaultType = 'all', symbol }: { defaultType?: 'all' | 'following', symbol?: string }) {
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isFa = language === 'fa';
  const [feedType, setFeedType] = useState<'all' | 'following'>(defaultType);
  
  let endpoint = '/api/community/feed';
  if (symbol) {
    endpoint = `/api/community/feed?symbol=${symbol}`;
  } else if (feedType === 'following') {
    endpoint = '/api/community/feed?type=following';
  }

  const { data: posts, error, isLoading, mutate } = useSWR<PostProps[]>(endpoint, fetcher);

  return (
    <div className={styles.feedContainer}>
      {!symbol && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--outline-variant)' }}>
          <button 
            onClick={() => setFeedType('all')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
              fontWeight: feedType === 'all' ? 700 : 500,
              color: feedType === 'all' ? 'var(--text)' : 'var(--muted)',
              borderBottom: feedType === 'all' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            {isFa ? 'برای شما' : 'For You'}
          </button>
          {user && (
            <button 
              onClick={() => setFeedType('following')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
                fontWeight: feedType === 'following' ? 700 : 500,
                color: feedType === 'following' ? 'var(--text)' : 'var(--muted)',
                borderBottom: feedType === 'following' ? '2px solid var(--primary)' : '2px solid transparent'
              }}
            >
              {isFa ? 'دنبال‌شوندگان' : 'Following'}
            </button>
          )}
        </div>
      )}

      {user && <CreatePostForm onPostCreated={() => mutate()} />}

      {isLoading && <div className={styles.loading}>{isFa ? 'در حال بارگذاری فید...' : 'Loading feed...'}</div>}
      
      {error && <div className={styles.error}>{isFa ? 'خطا در بارگذاری فید انجمن. لطفاً دوباره تلاش کنید.' : 'Failed to load community feed. Please try again.'}</div>}

      {posts && posts.map(post => (
        <CommunityPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
