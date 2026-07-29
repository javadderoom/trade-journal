import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import './blog.scss';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  return {
    title: isEn ? 'TradeKav Blog | Educational Articles' : 'وبلاگ تریدکاو | مقالات آموزشی ترید',
    description: isEn 
      ? 'Latest educational articles on trading psychology, forex strategies, risk management, and comprehensive tutorials for traders on TradeKav.' 
      : 'آخرین مقالات آموزشی درباره روانشناسی معاملات، استراتژی‌های فارکس، مدیریت سرمایه و آموزش‌های جامع برای تریدرها در وبلاگ تریدکاو.',
  };
}

async function getPosts(locale: string, page = 1) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${API_URL}/api/blog/posts?locale=${locale}&page=${page}&limit=15`, { next: { revalidate: 60 } });
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

  // Extract featured posts if on page 1 and we have enough posts
  const isFirstPage = currentPage === 1;
  const hasEnoughPostsForFeatured = posts.length >= 6;
  
  const featuredPosts = (isFirstPage && hasEnoughPostsForFeatured) ? posts.slice(0, 3) : [];
  const gridPosts = (isFirstPage && hasEnoughPostsForFeatured) ? posts.slice(3) : posts;

  return (
    <div className={`blog-index-page ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
      <div className="blog-hero">
        <div className="hero-content">
          <h1>{isEn ? 'Blogs on Trading & Psychology' : 'مقالات روانشناسی و استراتژی معاملاتی'}</h1>
          <p>{isEn ? 'A collection of the best educational articles to improve your trading edge.' : 'مجموعه‌ای از بهترین مقالات آموزشی برای ارتقای سطح و برتری شما در بازارهای مالی.'}</p>
        </div>
      </div>

      <div className="blog-container">
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#9ca3af', fontSize: '18px' }}>
            {isEn ? 'No articles found yet.' : 'هنوز مقاله‌ای منتشر نشده است.'}
          </div>
        ) : (
          <>
            {/* Featured Posts Row */}
            {featuredPosts.length > 0 && (
              <>
                <h2 className="section-title">{isEn ? 'Featured Updates' : 'مقالات برگزیده'}</h2>
                <div className="featured-row">
                  {featuredPosts.map((post: any) => (
                    <Link href={`/${locale}/blog/${post.slug}`} key={post.id} className="featured-card">
                      {post.cover_image && (
                        <img src={post.cover_image} alt={post.title} loading="lazy" />
                      )}
                      <div className="featured-content">
                        {post.category && <span className="post-category">{post.category.name}</span>}
                        <h2 className="post-title">{post.title}</h2>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Masonry/Bento Grid for remaining posts */}
            <h2 className="section-title">{isEn ? 'Latest Articles' : 'آخرین مقالات'}</h2>
            <div className="posts-grid">
              {gridPosts.map((post: any, index: number) => {
                // Make every 5th post (0-indexed 0, 5, 10...) span 2 columns for a dynamic layout
                const isSpan2 = index % 5 === 0 && index !== 0; 
                return (
                  <Link href={`/${locale}/blog/${post.slug}`} key={post.id} className={`post-card ${isSpan2 ? 'span-2' : ''}`}>
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
                        <div className="author-avatar">
                          {post.author?.name ? post.author.name.charAt(0) : 'T'}
                        </div>
                        <div className="meta-text">
                          <span className="post-author">{post.author?.name || (isEn ? 'TradeKav Team' : 'تیم تریدکاو')}</span>
                          <span>
                            {new Date(post.published_at || post.created_at).toLocaleDateString(isEn ? 'en-US' : 'fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
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
          </>
        )}
      </div>
    </div>
  );
}
