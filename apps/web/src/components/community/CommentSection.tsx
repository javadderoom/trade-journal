import React, { useState } from 'react';
import useSWR from 'swr';
import { api, fetcher } from '@/lib/api';
import styles from './CommentSection.module.scss';
import { useAuthStore } from '@/lib/auth';
import { useTranslation } from '@/store/useAppStore';
import { ReportModal } from './ReportModal';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}
function CommentNode({ comment, postId, onReplySuccess }: { comment: Comment; postId: string; onReplySuccess: () => void }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isFa = language === 'fa';

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/community/feed/${postId}/comments`, { 
        content: replyContent, 
        parentId: comment.id 
      });
      setReplyContent('');
      setShowReplyInput(false);
      onReplySuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.commentItem}>
      <div className={styles.avatarSmall}>
        {comment.author.avatar_url ? (
          <img src={comment.author.avatar_url} alt={comment.author.name} />
        ) : (
          comment.author.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <span className={styles.authorName}>{comment.author.name}</span>
        </div>
        <div className={styles.text}>{comment.content}</div>
        
        <div className={styles.commentActions}>
          <button onClick={() => setShowReplyInput(!showReplyInput)}>{isFa ? 'پاسخ' : 'Reply'}</button>
          <button className={styles.reportBtn} onClick={() => setShowReport(true)}>{isFa ? 'گزارش' : 'Report'}</button>
        </div>

        {showReplyInput && (
          <div className={styles.inputArea} style={{ marginTop: '8px' }}>
            <input 
              type="text" 
              value={replyContent} 
              onChange={e => setReplyContent(e.target.value)}
              placeholder={isFa ? 'نوشتن پاسخ...' : 'Write a reply...'} 
              disabled={isSubmitting}
              onKeyDown={e => { if (e.key === 'Enter') handleReplySubmit(); }}
            />
            <button disabled={!replyContent.trim() || isSubmitting} onClick={handleReplySubmit}>{isFa ? 'ارسال' : 'Post'}</button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map(reply => (
              <CommentNode key={reply.id} comment={reply} postId={postId} onReplySuccess={onReplySuccess} />
            ))}
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal 
          targetId={comment.id}
          targetType="COMMENT"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export function CommentSection({ postId }: { postId: string }) {
  const { data: comments, mutate, isLoading } = useSWR<Comment[]>(`/api/community/feed/${postId}/comments`, fetcher);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isFa = language === 'fa';

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/community/feed/${postId}/comments`, { content: newComment });
      setNewComment('');
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.commentSection}>
      <div className={styles.inputArea}>
        <div className={styles.avatar}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="User" />
          ) : (
             user?.name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
        <input 
          type="text" 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
          placeholder={isFa ? 'نوشتن نظر...' : 'Write a comment...'} 
          disabled={isSubmitting}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <button disabled={!newComment.trim() || isSubmitting} onClick={handleSubmit}>{isFa ? 'ارسال' : 'Post'}</button>
      </div>
      
      <div className={styles.list}>
        {isLoading && <div className={styles.loading}>{isFa ? 'در حال بارگذاری نظرات...' : 'Loading comments...'}</div>}
        {comments && comments.map(comment => (
          <CommentNode key={comment.id} comment={comment} postId={postId} onReplySuccess={() => mutate()} />
        ))}
      </div>
    </div>
  );
}
