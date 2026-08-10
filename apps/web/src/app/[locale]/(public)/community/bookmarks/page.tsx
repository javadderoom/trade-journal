import React from 'react';
import { Metadata } from 'next';
import { BookmarksFeed } from '@/components/community/BookmarksFeed';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bookmarks | TradeKav Community',
  description: 'View your saved community posts.',
};

export default function BookmarksPage({ params }: { params: { locale: string } }) {
  const isFa = params.locale === 'fa';
  return (
    <div className="main-content-wrapper">
      <div style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/${params.locale}/community`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
            &larr; {isFa ? 'بازگشت به انجمن' : 'Back to Community'}
          </Link>
        </div>
        
        <h1 style={{ marginBottom: '8px' }}>{isFa ? 'نشان شده‌ها' : 'Bookmarks'}</h1>
        <p className="larg" style={{ color: 'var(--muted)', marginBottom: '32px' }}>
          {isFa ? 'پست‌های ذخیره شده خود را اینجا ببینید.' : 'View your saved community posts.'}
        </p>
        
        <BookmarksFeed />
      </div>
    </div>
  );
}
