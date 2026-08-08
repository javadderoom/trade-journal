'use client';

import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import styles from './CommunityFeed.module.scss';
import { CommunityPostCard, PostProps } from './CommunityPostCard';
import { CreatePostForm } from './CreatePostForm';

const fetcher = (url: string) => axios.get(`http://localhost:3000${url}`, { withCredentials: true }).then(res => res.data);

export function CommunityFeed() {
  const { data: posts, error, isLoading, mutate } = useSWR<PostProps[]>('/api/community/feed', fetcher);

  return (
    <div className={styles.feedContainer}>
      <CreatePostForm onPostCreated={() => mutate()} />

      {isLoading && <div className={styles.loading}>Loading feed...</div>}
      
      {error && <div className={styles.error}>Failed to load community feed. Please try again.</div>}

      {posts && posts.map(post => (
        <CommunityPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
