"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './FollowButton.module.scss';
import { useAuthStore } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FollowButtonProps {
  targetId: string;
  targetType: 'USER' | 'SYMBOL';
}

export function FollowButton({ targetId, targetType }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !targetId) return;
    
    axios.get(`${API_URL}/api/community/follow/status`, {
      params: { targetId, targetType },
      withCredentials: true
    })
    .then(res => {
      setIsFollowing(res.data.isFollowing);
      setIsLoading(false);
    })
    .catch(e => {
      console.error(e);
      setIsLoading(false);
    });
  }, [targetId, targetType, user]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLoading) return;
    
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    
    try {
      if (wasFollowing) {
        await axios.delete(`${API_URL}/api/community/follow`, {
          data: { targetId, targetType },
          withCredentials: true
        });
      } else {
        await axios.post(`${API_URL}/api/community/follow`, {
          targetId, targetType
        }, { withCredentials: true });
      }
    } catch (e) {
      console.error(e);
      setIsFollowing(wasFollowing);
    }
  };

  if (!user) return null;
  if (targetType === 'USER' && user.id === targetId) return null;

  return (
    <button 
      className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
