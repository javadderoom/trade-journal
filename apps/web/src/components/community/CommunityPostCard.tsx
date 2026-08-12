import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './CommunityPostCard.module.scss';
import { TradePreviewCard, TradePreviewProps } from './TradePreviewCard';
import { CommentSection } from './CommentSection';
import { FollowButton } from './FollowButton';
import { ReportModal } from './ReportModal';

export interface PostProps {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  trade?: TradePreviewProps | null;
  symbols: string[];
  _count: {
    commentsRel: number;
    likesRel: number;
  };
  isLikedByMe?: boolean;
  isBookmarked?: boolean;
  media?: { id: string; url: string; sortOrder: number }[];
}

export function CommunityPostCard({ post }: { post: PostProps }) {
  const params = useParams();
  const locale = params?.locale || 'en';
  const isFa = locale === 'fa';
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [likeCount, setLikeCount] = useState(post._count.likesRel);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      await api.post(`/api/community/feed/${post.id}/bookmark`);
    } catch (e) {
      console.error('Failed to bookmark post:', e);
      setIsBookmarked(isBookmarked);
    }
  };

  const handleReportClick = () => {
    setShowReportModal(true);
  };

  const handleLike = async () => {
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    try {
      await api.post(`/api/community/feed/${post.id}/like`);
    } catch (e) {
      console.error('Failed to like post:', e);
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    }
  };

  // simple relative time formatter
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return isFa ? 'لحظاتی پیش' : `${diff}s`;
    if (diff < 3600) return isFa ? `${Math.floor(diff / 60)} دقیقه پیش` : `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return isFa ? `${Math.floor(diff / 3600)} ساعت پیش` : `${Math.floor(diff / 3600)}h`;
    return isFa ? `${Math.floor(diff / 86400)} روز پیش` : `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className={styles.card}>
      <Link href={`/${locale}/community/user/${post.author.id}`} style={{ textDecoration: 'none' }}>
        <div className={styles.avatarContainer} style={{ cursor: 'pointer' }}>
          {post.author.avatar_url ? (
            <img src={post.author.avatar_url} alt={post.author.name} />
          ) : (
            post.author.name.charAt(0).toUpperCase()
          )}
        </div>
      </Link>

      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={`/${locale}/community/user/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className={styles.authorName} style={{ cursor: 'pointer' }}>{post.author.name}</span>
            </Link>
            <FollowButton targetId={post.author.id} targetType="USER" />
          </div>
          <span className={styles.time}>· {formatTime(post.createdAt)}</span>
        </div>

        {post.content && <div className={styles.body}>{post.content}</div>}

        {post.symbols && post.symbols.length > 0 && (
          <div className={styles.symbols}>
            {post.symbols.map((symbol: any) => (
              <Link key={symbol.id} href={`/${locale}/community/symbols/${symbol.symbol}`} className={styles.symbol}>
                ${symbol.symbol}
              </Link>
            ))}
          </div>
        )}

        {post.media && post.media.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {post.media.map(m => (
              <img key={m.id} src={`${api.defaults.baseURL || 'http://localhost:3000'}${m.url}`} alt="Post media" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'contain' }} />
            ))}
          </div>
        )}

        {post.trade && <TradePreviewCard trade={post.trade} />}

        <div className={styles.actions}>
          <button 
            title={isFa ? "پسندیدن" : "Like"} 
            onClick={handleLike} 
            style={isLiked ? { color: 'var(--primary)' } : {}}
          >
             <svg fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
             {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button 
            title={isFa ? "نظر" : "Comment"} 
            onClick={() => setShowComments(!showComments)}
            style={showComments ? { color: 'var(--primary)' } : {}}
          >
             <svg fill={showComments ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             {post._count.commentsRel > 0 && <span>{post._count.commentsRel}</span>}
          </button>
          <button 
            title={isFa ? "نشان کردن" : "Bookmark"} 
            onClick={handleBookmark} 
            style={isBookmarked ? { color: 'var(--primary)' } : {}}
          >
             <svg fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>
          
          <button title={isFa ? "گزارش تخلف" : "Report"} onClick={handleReportClick} style={{ marginLeft: 'auto', color: 'var(--error)' }}>
             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </button>
        </div>

        {showComments && <CommentSection postId={post.id} />}
      </div>
      
      {showReportModal && (
        <ReportModal 
          targetId={post.id}
          targetType="POST"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
