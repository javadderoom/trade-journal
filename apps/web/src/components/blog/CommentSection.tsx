'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import LoadingButton from '@/components/ui/LoadingButton';
import './CommentSection.scss';

interface CommentSectionProps {
  postId: string;
  initialComments: any[];
  locale: string;
}

export default function CommentSection({ postId, initialComments, locale }: CommentSectionProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const isEn = locale === 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!user) {
      notify.error(isEn ? 'Please login to post a comment' : 'برای ثبت نظر لطفا وارد شوید');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/blog/posts/${postId}/comments`, { content });
      notify.success(isEn ? 'Comment submitted and awaiting approval' : 'نظر شما ثبت شد و در انتظار تایید است');
      setContent('');
    } catch (error: any) {
      notify.error(isEn ? 'Failed to submit comment' : 'خطا در ثبت نظر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`comments-section ${isEn ? 'ltr' : 'rtl'}`}>
      <h3>{isEn ? `Comments (${comments.length})` : `نظرات (${comments.length})`}</h3>
      
      <div className="comment-form-container">
        {user ? (
          <form onSubmit={handleSubmit} className="comment-form">
            <textarea
              placeholder={isEn ? "Write your comment here..." : "نظر خود را اینجا بنویسید..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
            <div className="form-actions">
              <LoadingButton isLoading={loading} type="submit" className="btn-primary">
                {isEn ? 'Post Comment' : 'ثبت نظر'}
              </LoadingButton>
            </div>
          </form>
        ) : (
          <div className="login-prompt">
            <p>{isEn ? 'You must be logged in to post a comment.' : 'برای ثبت نظر باید وارد حساب کاربری خود شوید.'}</p>
            <a href={`/${locale}/login`} className="btn btn-secondary">
              {isEn ? 'Login' : 'ورود به حساب'}
            </a>
          </div>
        )}
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">{isEn ? 'No comments yet. Be the first to comment!' : 'هنوز نظری ثبت نشده است. اولین نفر باشید!'}</p>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="comment-thread">
              <div className="comment">
                <div className="comment-header">
                  <div className="comment-author">
                    {comment.user?.avatar_url ? (
                      <img src={comment.user.avatar_url} alt={comment.user.name} className="avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}
                    <strong>{comment.user?.name || (isEn ? 'User' : 'کاربر')}</strong>
                  </div>
                  <small>{new Date(comment.created_at).toLocaleDateString(isEn ? 'en-US' : 'fa-IR')}</small>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="comment-replies">
                  {comment.replies.map((reply: any) => (
                    <div key={reply.id} className="comment reply">
                      <div className="comment-header">
                        <div className="comment-author">
                          {reply.user?.avatar_url ? (
                            <img src={reply.user.avatar_url} alt={reply.user.name} className="avatar admin-avatar" />
                          ) : (
                            <div className="avatar-placeholder admin-avatar">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                          )}
                          <strong>{reply.user?.name || (isEn ? 'Admin' : 'مدیر')}</strong>
                          <span className="admin-badge">{isEn ? 'Admin' : 'مدیر'}</span>
                        </div>
                        <small>{new Date(reply.created_at).toLocaleDateString(isEn ? 'en-US' : 'fa-IR')}</small>
                      </div>
                      <p className="comment-content">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
