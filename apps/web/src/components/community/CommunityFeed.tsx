'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import styles from './CommunityFeed.module.scss';
import { CommunityPostCard, PostProps } from './CommunityPostCard';
import { CreatePostForm } from './CreatePostForm';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const fetcher = (url: string) => axios.get(`${API_URL}${url}`, { withCredentials: true }).then(res => res.data);

export function CommunityFeed({ defaultType = 'all', symbol }: { defaultType?: 'all' | 'following', symbol?: string }) {
  const [feedType, setFeedType] = React.useState<'all' | 'following'>(defaultType);
  
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
            For You
          </button>
          <button 
            onClick={() => setFeedType('following')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
              fontWeight: feedType === 'following' ? 700 : 500,
              color: feedType === 'following' ? 'var(--text)' : 'var(--muted)',
              borderBottom: feedType === 'following' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            Following
          </button>
        </div>
      )}

      <CreatePostForm onPostCreated={() => mutate()} />

      {isLoading && <div className={styles.loading}>Loading feed...</div>}
      
      {error && <div className={styles.error}>Failed to load community feed. Please try again.</div>}

      {posts && posts.map(post => (
        <CommunityPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
