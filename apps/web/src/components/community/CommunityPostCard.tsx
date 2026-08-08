import React, { useState } from 'react';
import axios from 'axios';
import styles from './CommunityPostCard.module.scss';
import { TradePreviewCard, TradePreviewProps } from './TradePreviewCard';
import { CommentSection } from './CommentSection';

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
}

export function CommunityPostCard({ post }: { post: PostProps }) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count.likesRel);

  const handleLike = async () => {
    if (isLiked) return;
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    try {
      await axios.post(`http://localhost:3000/api/community/feed/${post.id}/like`, {}, { withCredentials: true });
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
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.avatarContainer}>
        {post.author.avatar_url ? (
          <img src={post.author.avatar_url} alt={post.author.name} />
        ) : (
          post.author.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <span className={styles.authorName}>{post.author.name}</span>
          <span className={styles.time}>· {formatTime(post.createdAt)}</span>
        </div>

        {post.content && <div className={styles.body}>{post.content}</div>}

        {post.symbols && post.symbols.length > 0 && (
          <div className={styles.symbols}>
            {post.symbols.map(sym => (
              <span key={sym} className={styles.symbol}>#{sym}</span>
            ))}
          </div>
        )}

        {post.trade && <TradePreviewCard trade={post.trade} />}

        <div className={styles.actions}>
          <button 
            title="Like" 
            onClick={handleLike} 
            style={isLiked ? { color: 'var(--primary)' } : {}}
          >
             <svg fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
             {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button 
            title="Comment" 
            onClick={() => setShowComments(!showComments)}
            style={showComments ? { color: 'var(--primary)' } : {}}
          >
             <svg fill={showComments ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             {post._count.commentsRel > 0 && <span>{post._count.commentsRel}</span>}
          </button>
        </div>

        {showComments && <CommentSection postId={post.id} />}
      </div>
    </div>
  );
}
