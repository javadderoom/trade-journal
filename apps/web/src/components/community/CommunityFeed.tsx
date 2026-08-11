'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import styles from './CommunityFeed.module.scss';
import { useTranslation } from '@/store/useAppStore';
import { CommunityPostCard, PostProps } from './CommunityPostCard';
import { CreatePostForm } from './CreatePostForm';
import { PostSkeleton } from './PostSkeleton';
import { EmptyFeedState } from './EmptyFeedState';
import { useAuthStore } from '@/lib/auth';
import { fetcher } from '@/lib/api';
import { motion } from 'framer-motion';

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
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setFeedType('all')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
              fontWeight: feedType === 'all' ? 700 : 500,
              color: feedType === 'all' ? 'var(--text)' : 'var(--muted)',
              position: 'relative'
            }}
          >
            {isFa ? 'برای شما' : 'For You'}
            {feedType === 'all' && (
              <motion.div
                layoutId="communityFeedTab"
                style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                  backgroundColor: 'var(--primary)', borderRadius: '2px 2px 0 0'
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          {user && (
            <button 
              onClick={() => setFeedType('following')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
                fontWeight: feedType === 'following' ? 700 : 500,
                color: feedType === 'following' ? 'var(--text)' : 'var(--muted)',
                position: 'relative'
              }}
            >
              {isFa ? 'دنبال‌شوندگان' : 'Following'}
              {feedType === 'following' && (
                <motion.div
                  layoutId="communityFeedTab"
                  style={{
                    position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                    backgroundColor: 'var(--primary)', borderRadius: '2px 2px 0 0'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )}
        </div>
      )}

      {user && <CreatePostForm onPostCreated={() => mutate()} />}

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      
      {error && <div className={styles.error}>{isFa ? 'خطا در بارگذاری فید انجمن. لطفاً دوباره تلاش کنید.' : 'Failed to load community feed. Please try again.'}</div>}

      {posts && posts.length === 0 && feedType === 'following' && !isLoading && (
        <EmptyFeedState onAction={() => setFeedType('all')} />
      )}

      {posts && posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
        >
          <CommunityPostCard post={post} />
        </motion.div>
      ))}
    </div>
  );
}
