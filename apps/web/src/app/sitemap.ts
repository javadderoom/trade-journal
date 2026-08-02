import { MetadataRoute } from "next";
import { TOPICS_DATA } from "../constants/topicsData";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tradekav.ir";
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  let dynamicBlogPages: MetadataRoute.Sitemap = [];

  const fetchPosts = async (locale: string) => {
    try {
      const res = await fetch(`${apiBase}/api/blog/posts?locale=${locale}&limit=1000`, { next: { revalidate: 3600 } });
      if (!res.ok) return [];
      const data = await res.json();
      return data.posts || [];
    } catch (error: any) {
      console.warn(`[sitemap] Could not fetch ${locale} blog posts:`, error.message);
      return [];
    }
  };

  const [postsFa, postsEn] = await Promise.all([
    fetchPosts('fa'),
    fetchPosts('en')
  ]);

  const allPosts = [...postsFa, ...postsEn];

  dynamicBlogPages = allPosts.map((post: any) => ({
    url: `${baseUrl}/${post.locale || 'fa'}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at || post.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));


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
    // Tools (separate locale routes)
    {
      url: `${baseUrl}/fa/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          fa: `${baseUrl}/fa/tools`,
          en: `${baseUrl}/en/tools`,
        },
      },
    },
    {
      url: `${baseUrl}/en/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          fa: `${baseUrl}/fa/tools`,
          en: `${baseUrl}/en/tools`,
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
