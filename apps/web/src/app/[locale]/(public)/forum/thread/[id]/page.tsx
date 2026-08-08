import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import styles from '../../forum.module.scss';
import { ThreadReplyForm } from './ThreadReplyForm';

export const metadata: Metadata = {
  title: 'Thread | TradeKav',
  description: 'Forum Thread',
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getThread(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/community/forum/thread/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function ThreadPage({ params }: { params: { locale: string, id: string } }) {
  const thread = await getThread(params.id);
  const isFa = params.locale === 'fa';

  if (!thread) {
    return (
      <div className="main-content-wrapper">
        <div className={styles.forumContainer} style={{ textAlign: 'center', padding: '60px' }}>
          <h2>{isFa ? 'تاپیک یافت نشد' : 'Thread not found'}</h2>
          <Link href={`/${params.locale}/forum`} style={{ color: 'var(--primary)' }}>
            {isFa ? 'بازگشت به انجمن' : 'Back to Forums'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-wrapper">
      <div className={styles.forumContainer}>
        <div className={styles.header}>
          <Link href={`/${params.locale}/forum/category/${thread.categoryId}`} style={{ color: 'var(--primary)', marginBottom: '12px', display: 'inline-block' }}>
            &larr; {isFa ? 'بازگشت به' : 'Back to'} {isFa ? thread.category?.nameFa : thread.category?.nameEn}
          </Link>
          <h1 style={{ fontSize: '24px' }}>{thread.title}</h1>
        </div>

        {/* Original Post */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-high)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden'
            }}>
              {thread.author.avatar_url ? (
                <img src={thread.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : thread.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{thread.author.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(thread.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: '1.6' }}>
            {thread.content}
          </div>
        </div>

        {/* Replies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <h3 style={{ margin: 0, paddingBottom: '8px', borderBottom: '1px solid rgba(var(--outline-variant-rgb), 0.4)' }}>
            {thread.repliesRel?.length || 0} {isFa ? 'پاسخ' : 'Replies'}
          </h3>
          {thread.repliesRel?.map((reply: any) => (
            <div key={reply.id} style={{
              background: reply.isSolution ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface-container-low)',
              border: reply.isSolution ? '1px solid var(--primary)' : '1px solid rgba(var(--outline-variant-rgb), 0.2)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {reply.isSolution && (
                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>
                  ✓ {isFa ? 'راه حل تایید شده' : 'Accepted Solution'}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-container-high)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden'
                }}>
                  {reply.author.avatar_url ? (
                    <img src={reply.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : reply.author.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{reply.author.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{new Date(reply.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                {reply.content}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <ThreadReplyForm threadId={thread.id} locale={params.locale} />
      </div>
    </div>
  );
}
