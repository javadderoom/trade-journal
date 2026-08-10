'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { CommunityPostCard, PostProps } from './CommunityPostCard';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const fetcher = (url: string) => axios.get(`${API_URL}${url}`, { withCredentials: true }).then(res => res.data);

export function BookmarksFeed() {
  const { data: posts, error, isLoading } = useSWR<PostProps[]>('/api/community/feed/bookmarks', fetcher);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading bookmarks...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>Failed to load bookmarks.</div>;
  
  if (posts?.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
        <p>You haven't bookmarked any posts yet.</p>
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
