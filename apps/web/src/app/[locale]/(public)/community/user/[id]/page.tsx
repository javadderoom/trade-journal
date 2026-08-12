'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { useTranslation } from '@/store/useAppStore';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { FollowButton } from '@/components/community/FollowButton';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  plan: string;
  _count: {
    communityPosts: number;
    communityFollowers: number;
    communityFollowing: number;
  };
}

export default function UserProfilePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = React.use(params);
  const { user: authUser } = useAuthStore();
  const { language } = useTranslation();
  const isFa = language === 'fa';
  
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'archived'>('posts');

  const { data: profile, error, isLoading } = useSWR<UserProfile>(`/api/community/user/${id}`, fetcher);

  const isOwnProfile = authUser?.id === id;

  if (isLoading) {
    return (
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '680px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
        <div className="dash-spinner" style={{ margin: '40px auto' }} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '680px', margin: '0 auto', textAlign: 'center', color: 'var(--error)' }}>
        {isFa ? 'کاربر یافت نشد' : 'User not found'}
      </div>
    );
  }

  // Determine feed URL based on active tab
  let feedUrl = `/api/community/feed?userId=${id}`;
  if (activeTab === 'saved') feedUrl = '/api/community/feed?type=bookmarks';
  if (activeTab === 'archived') feedUrl = '/api/community/feed?type=archived';

  const joinDate = new Date(profile.created_at).toLocaleDateString(isFa ? 'fa-IR' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div style={{ flex: 1, width: '100%', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <div style={{ padding: '32px 24px', maxWidth: '680px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '32px 24px', 
          backgroundColor: 'var(--surface-container-low)', 
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          position: 'relative'
        }}>
          {!isOwnProfile && (
            <div style={{ position: 'absolute', top: '24px', right: isFa ? 'auto' : '24px', left: isFa ? '24px' : 'auto' }}>
              <FollowButton targetId={id} targetType="USER" />
            </div>
          )}

          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface-variant)' }} />
          ) : (
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: 'white' }}>
              {profile.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}

          <h1 style={{ margin: '16px 0 4px 0', fontSize: '24px' }}>{profile.name}</h1>
          
          <div style={{ display: 'flex', gap: '16px', color: 'var(--muted)', fontSize: '14px', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <strong style={{ color: 'var(--text)' }}>{profile._count.communityFollowers}</strong>
              <span>{isFa ? 'دنبال‌کننده' : 'Followers'}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <strong style={{ color: 'var(--text)' }}>{profile._count.communityFollowing}</strong>
              <span>{isFa ? 'دنبال‌شونده' : 'Following'}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <strong style={{ color: 'var(--text)' }}>{profile._count.communityPosts}</strong>
              <span>{isFa ? 'پست' : 'Posts'}</span>
            </div>
          </div>

          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
            {isFa ? `عضویت از ${joinDate}` : `Joined ${joinDate}`}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setActiveTab('posts')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
              fontWeight: activeTab === 'posts' ? 700 : 500,
              color: activeTab === 'posts' ? 'var(--text)' : 'var(--muted)',
              position: 'relative'
            }}
          >
            {isFa ? 'پست‌ها' : 'Posts'}
            {activeTab === 'posts' && (
              <motion.div
                layoutId="profileTab"
                style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                  backgroundColor: 'var(--primary)', borderRadius: '2px 2px 0 0'
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('saved')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
                fontWeight: activeTab === 'saved' ? 700 : 500,
                color: activeTab === 'saved' ? 'var(--text)' : 'var(--muted)',
                position: 'relative'
              }}
            >
              {isFa ? 'ذخیره‌شده‌ها' : 'Saved'}
              {activeTab === 'saved' && (
                <motion.div
                  layoutId="profileTab"
                  style={{
                    position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
                    backgroundColor: 'var(--primary)', borderRadius: '2px 2px 0 0'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('archived')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
                fontWeight: activeTab === 'archived' ? 700 : 500,
                color: activeTab === 'archived' ? 'var(--text)' : 'var(--muted)',
                position: 'relative'
              }}
            >
              {isFa ? 'بایگانی‌شده‌ها' : 'Archived'}
              {activeTab === 'archived' && (
                <motion.div
                  layoutId="profileTab"
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

        {/* Feed */}
        <div style={{ marginTop: '8px' }}>
          <CommunityFeed feedUrl={feedUrl} />
        </div>

      </div>
    </div>
  );
}
