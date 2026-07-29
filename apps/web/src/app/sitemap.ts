import { MetadataRoute } from "next";
import { TOPICS_DATA } from "../constants/topicsData";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tradekav.ir";
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  let dynamicBlogPages: MetadataRoute.Sitemap = [];
  try {
    const [resFa, resEn] = await Promise.all([
      fetch(`${apiBase}/api/blog/posts?locale=fa&limit=100`),
      fetch(`${apiBase}/api/blog/posts?locale=en&limit=100`)
    ]);
    
    let allPosts: any[] = [];
    if (resFa.ok) allPosts = [...allPosts, ...(await resFa.json()).posts];
    if (resEn.ok) allPosts = [...allPosts, ...(await resEn.json()).posts];

    dynamicBlogPages = allPosts.map((post: any) => ({
      url: `${baseUrl}/${post.locale || 'fa'}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || post.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.warn("Could not fetch blog posts for sitemap");
  }

  const publicPages: MetadataRoute.Sitemap = [
    // Landing pages (separate locale routes)
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
      alternates: {
        languages: {
          fa: `${baseUrl}/`,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
      alternates: {
        languages: {
          fa: `${baseUrl}/`,
          en: `${baseUrl}/en`,
        },
      },
    },
    // Contact (separate locale routes)
    {
      url: `${baseUrl}/fa/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: {
        languages: {
          fa: `${baseUrl}/fa/contact`,
          en: `${baseUrl}/en/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/en/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
      alternates: {
        languages: {
          fa: `${baseUrl}/fa/contact`,
          en: `${baseUrl}/en/contact`,
        },
      },
    },
    // Shared pages (no separate locale routes, language switches client-side)
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/help/ea-setup`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/namad`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/fa/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: {
          fa: `${baseUrl}/fa/blog`,
          en: `${baseUrl}/en/blog`,
        },
      },
    },
    {
      url: `${baseUrl}/en/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: {
          fa: `${baseUrl}/fa/blog`,
          en: `${baseUrl}/en/blog`,
        },
      },
    },
    // Programmatic Topic SEO Landing Pages
    ...Object.keys(TOPICS_DATA).flatMap((topicSlug) => [
      {
        url: `${baseUrl}/fa/topic/${topicSlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: {
            fa: `${baseUrl}/fa/topic/${topicSlug}`,
            en: `${baseUrl}/en/topic/${topicSlug}`,
          },
        },
      },
      {
        url: `${baseUrl}/en/topic/${topicSlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: {
            fa: `${baseUrl}/fa/topic/${topicSlug}`,
            en: `${baseUrl}/en/topic/${topicSlug}`,
          },
        },
      },
    ]),
    ...dynamicBlogPages,
  ];

  return publicPages;
}
