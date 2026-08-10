'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useTranslation } from '@/store/useAppStore';
import { CommunityPostCard, PostProps } from './CommunityPostCard';

export function BookmarksFeed() {
  const { language } = useTranslation();
  const isFa = language === 'fa';
  const { data: posts, error, isLoading } = useSWR<PostProps[]>('/api/community/feed/bookmarks', fetcher);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>{isFa ? 'در حال بارگذاری نشان‌شده‌ها...' : 'Loading bookmarks...'}</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>{isFa ? 'خطا در بارگذاری نشان‌شده‌ها.' : 'Failed to load bookmarks.'}</div>;
  
  if (posts?.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
        <p>{isFa ? 'شما هنوز پستی را نشان نکرده‌اید.' : "You haven't bookmarked any posts yet."}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {posts && posts.map(post => (
        <CommunityPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
