import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import styles from '../../forum.module.scss';
import axios from 'axios';
import { CreateThreadForm } from './CreateThreadForm';

export const metadata: Metadata = {
  title: 'Category | TradeKav',
  description: 'Forum Category',
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getCategoryThreads(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/community/forum/category/${id}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function CategoryPage({ params }: { params: { locale: string, id: string } }) {
  const threads = await getCategoryThreads(params.id);
  const isFa = params.locale === 'fa';

  return (
    <div className="main-content-wrapper">
      <div className={styles.forumContainer}>
        <div className={styles.header}>
          <Link href={`/${params.locale}/forum`} style={{ color: 'var(--primary)', marginBottom: '12px', display: 'inline-block' }}>
            &larr; {isFa ? 'بازگشت به انجمن' : 'Back to Forums'}
          </Link>
          <h1>{isFa ? 'تاپیک‌ها' : 'Threads'}</h1>
        </div>

        <CreateThreadForm categoryId={params.id} locale={params.locale} />

        <div className={styles.categoryList} style={{ marginTop: '24px' }}>
          {threads.map((thread: any) => (
            <Link key={thread.id} href={`/${params.locale}/forum/thread/${thread.id}`} className={styles.categoryCard}>
              <div className={styles.content}>
                <h2>{thread.title}</h2>
                <p>{isFa ? 'نوشته شده توسط' : 'By'} {thread.author.name} · {new Date(thread.createdAt).toLocaleDateString()}</p>
              </div>
              <div className={styles.stats}>
                <span className={styles.count}>{thread._count?.repliesRel || 0}</span>
                <span className={styles.label}>{isFa ? 'پاسخ' : 'Replies'}</span>
              </div>
            </Link>
          ))}
          {threads.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>
              {isFa ? 'هیچ تاپیکی یافت نشد. اولین نفر باشید!' : 'No threads found. Be the first!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
