import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import './single-post.scss';

async function getPost(slug: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${API_URL}/api/blog/posts/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.warn('[Blog] Could not fetch post during build', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.seo_title || `${post.title} | وبلاگ تریدکاو`,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.cover_image ? [post.cover_image] : [],
      type: 'article',
      publishedTime: post.published_at || post.created_at,
    }
  };
}

export default async function SinglePostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.cover_image ? [post.cover_image] : [],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: [{
      '@type': 'Person',
      name: post.author?.name || 'تریدکاو',
    }],
    description: post.excerpt,
  };

  return (
    <div className="single-post-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <article className="post-article">
        <header className="post-header">
          {post.category && <span className="post-category">{post.category.name}</span>}
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <span className="post-author">
              <span className="material-symbols-outlined">person</span>
              {post.author?.name || 'تریدکاو'}
            </span>
            <span className="post-date">
              <span className="material-symbols-outlined">calendar_today</span>
              {new Date(post.published_at || post.created_at).toLocaleDateString('fa-IR')}
            </span>
            <span className="post-views">
              <span className="material-symbols-outlined">visibility</span>
              {post.view_count} بازدید
            </span>
          </div>
        </header>

        {post.cover_image && (
          <div className="post-cover-image">
            <img src={post.cover_image} alt={post.title} />
          </div>
        )}

        <div className="post-content tiptap" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag: any) => (
              <span key={tag.id} className="tag">#{tag.name}</span>
            ))}
          </div>
        )}
      </article>
      
      {/* Comments section UI would go here */}
      <div className="comments-section">
        <h3>نظرات ({post.comments?.length || 0})</h3>
        {/* Simple comment list for now */}
        {post.comments?.map((comment: any) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <strong>{comment.user?.name || 'کاربر'}</strong>
              <small>{new Date(comment.created_at).toLocaleDateString('fa-IR')}</small>
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
