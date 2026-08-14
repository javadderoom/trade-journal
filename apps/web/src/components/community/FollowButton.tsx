"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import styles from './FollowButton.module.scss';
import { useAuthStore } from '@/lib/auth';
import { useTranslation } from '@/store/useAppStore';

interface FollowButtonProps {
  targetId: string;
  targetType: 'USER' | 'SYMBOL';
}

export function FollowButton({ targetId, targetType }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isFa = language === 'fa';

  useEffect(() => {
    if (!user || !targetId) return;
    
    api.get('/api/community/follow/status', {
      params: { targetId, targetType }
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
        await api.delete('/api/community/follow', {
          data: { targetId, targetType }
        });
      } else {
        await api.post('/api/community/follow', {
          targetId, targetType
        });
      }
    } catch (e) {
      console.error(e);
      setIsFollowing(wasFollowing);
    }
  };

  if (!user) return null;
  if (targetType === 'USER' && targetId === 'anonymous') return null;
  if (targetType === 'USER' && user.id === targetId) return null;

  return (
    <button 
      className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isFollowing ? (isFa ? 'دنبال‌شونده' : 'Following') : (isFa ? 'دنبال کردن' : 'Follow')}
    </button>
  );
}
