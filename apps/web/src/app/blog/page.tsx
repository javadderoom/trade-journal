import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import './blog.scss';

export const metadata: Metadata = {
  title: 'وبلاگ تریدکاو | مقالات آموزشی ترید و فارکس',
  description: 'آخرین مقالات آموزشی درباره روانشناسی معاملات، استراتژی‌های فارکس، مدیریت سرمایه و آموزش‌های جامع برای تریدرها در وبلاگ تریدکاو.',
};

async function getPosts(page = 1) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${API_URL}/api/blog/posts?page=${page}&limit=12`, { next: { revalidate: 60 } });
    if (!res.ok) return { posts: [], totalPages: 1 };
    return res.json();
  } catch (error) {
    console.warn('[Blog] Could not fetch posts during build', error);
    return { posts: [], totalPages: 1 };
  }
}

export default async function BlogIndexPage({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = Number(searchParams.page) || 1;
  const { posts, totalPages } = await getPosts(currentPage);

  return (
    <div className="blog-index-page">
      <div className="blog-hero">
        <h1>وبلاگ تریدکاو</h1>
        <p>مجموعه‌ای از بهترین مقالات آموزشی برای ارتقای سطح معامله‌گری شما</p>
      </div>

      <div className="blog-container">
        {posts.length === 0 ? (
          <div className="no-posts">مقاله‌ای یافت نشد.</div>
        ) : (
          <div className="posts-grid">
            {posts.map((post: any) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="post-card">
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
                    <span className="post-author">{post.author?.name || 'تریدکاو'}</span>
                    <span className="post-date">
                      {new Date(post.published_at || post.created_at).toLocaleDateString('fa-IR')}
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
                href={`/blog?page=${i + 1}`} 
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
