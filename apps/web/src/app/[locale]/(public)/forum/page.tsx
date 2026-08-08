import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import styles from './forum.module.scss';

export const metadata: Metadata = {
  title: 'Forum | TradeKav',
  description: 'Deep-dive trading discussions, strategy reviews, and Q&A.',
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const revalidate = 60;

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/api/community/forum/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function ForumIndexPage({ params }: { params: { locale: string } }) {
  const categories = await getCategories();
  const isFa = params.locale === 'fa';

  return (
    <div className="main-content-wrapper">
      <div className={styles.forumContainer}>
        <div className={styles.header}>
          <h1>{isFa ? 'انجمن' : 'Forums'}</h1>
          <p>{isFa ? 'بحث‌های ساختاریافته، استراتژی‌ها و پرسش و پاسخ.' : 'Structured discussions, strategies, and Q&A.'}</p>
        </div>

        <div className={styles.categoryList}>
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/${params.locale}/forum/category/${cat.id}`} className={styles.categoryCard}>
              <div className={styles.content}>
                <h2>{isFa ? cat.nameFa : cat.nameEn}</h2>
                <p>{isFa ? cat.descriptionFa : cat.descriptionEn}</p>
              </div>
              <div className={styles.stats}>
                <span className={styles.count}>{cat._count?.threads || 0}</span>
                <span className={styles.label}>{isFa ? 'تاپیک' : 'Threads'}</span>
              </div>
            </Link>
          ))}
          {categories.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>
              {isFa ? 'هیچ دسته‌ای یافت نشد.' : 'No categories found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
