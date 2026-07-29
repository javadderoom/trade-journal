import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import './blog.scss';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'TradeKav Blog | Trading & Forex Educational Articles' : 'وبلاگ تریدکاو | مقالات آموزشی ترید و فارکس',
    description: isEn 
      ? 'Latest educational articles on trading psychology, forex strategies, risk management, and comprehensive tutorials for traders on TradeKav blog.' 
      : 'آخرین مقالات آموزشی درباره روانشناسی معاملات، استراتژی‌های فارکس، مدیریت سرمایه و آموزش‌های جامع برای تریدرها در وبلاگ تریدکاو.',
  };
}

async function getPosts(locale: string, page = 1) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${API_URL}/api/blog/posts?locale=${locale}&page=${page}&limit=12`, { next: { revalidate: 60 } });
    if (!res.ok) return { posts: [], totalPages: 1 };
    return res.json();
  } catch (error) {
    console.warn('[Blog] Could not fetch posts during build', error);
    return { posts: [], totalPages: 1 };
  }
}

export default async function BlogIndexPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ page?: string }> }) {
  const { locale: rawLocale } = await params;
  const { page } = await searchParams;
  
  const locale = rawLocale || 'fa';
  const isEn = locale === 'en';
  const currentPage = Number(page) || 1;
  const { posts, totalPages } = await getPosts(locale, currentPage);

  return (
    <div className={`blog-index-page ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
      <div className="blog-hero">
        <h1>{isEn ? 'TradeKav Blog' : 'وبلاگ تریدکاو'}</h1>
        <p>{isEn ? 'A collection of the best educational articles to improve your trading skills' : 'مجموعه‌ای از بهترین مقالات آموزشی برای ارتقای سطح معامله‌گری شما'}</p>
      </div>

      <div className="blog-container">
        {posts.length === 0 ? (
          <div className="no-posts">{isEn ? 'No articles found.' : 'مقاله‌ای یافت نشد.'}</div>
        ) : (
          <div className="posts-grid">
            {posts.map((post: any) => (
              <Link href={`/${locale}/blog/${post.slug}`} key={post.id} className="post-card">
                <div className="post-cover">
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} loading="lazy" />
                  ) : (
                    <div className="placeholder-cover">TradeKav</div>
                  )}
                  {post.category && <span className="post-category">{post.category.name}</span>}
                </div>
                <div className="post-content">
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <div className="post-meta">
                    <span className="post-author">{post.author?.name || (isEn ? 'TradeKav' : 'تریدکاو')}</span>
                    <span className="post-date">
                      {new Date(post.published_at || post.created_at).toLocaleDateString(isEn ? 'en-US' : 'fa-IR')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link 
                key={i} 
                href={`/${locale}/blog?page=${i + 1}`} 
                className={`page-link ${currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
