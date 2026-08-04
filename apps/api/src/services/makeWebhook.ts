/**
 * Make.com Webhook Service
 * 
 * Sends a blog post snippet + cover image URL to a Cloudflare Worker proxy,
 * which forwards it to Make.com (bypassing geo-restrictions).
 * 
 * Required env vars:
 *   MAKE_PROXY_URL    — Your Cloudflare Worker URL (e.g. https://make-proxy.your-domain.workers.dev)
 *   MAKE_PROXY_SECRET — Shared secret matching the Worker's PROXY_SECRET
 */

const FRONTEND_URL = 'https://tradekav.ir';

interface BlogPostPayload {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  locale: string;
  social_copy?: string | null;
}

/**
 * Constructs and sends a webhook payload via the Cloudflare proxy when a blog is published.
 * The payload contains a short snippet, the cover image URL, and a link back
 * to the original post. Social platforms will receive this via Make.com scenarios.
 */
export async function triggerBlogWebhook(post: BlogPostPayload): Promise<void> {
  const proxyUrl = process.env.MAKE_PROXY_URL;
  const proxySecret = process.env.MAKE_PROXY_SECRET;

  if (!proxyUrl) {
    console.warn('[Make Webhook] MAKE_PROXY_URL is not set. Skipping social media posting.');
    return;
  }

  try {
    // Build the blog URL based on locale (strictly prefix the locale)
    const postUrl = `${FRONTEND_URL}/${post.locale}/blog/${post.slug}`;

    // Build the cover image URL (absolute)
    let coverImageUrl: string | null = null;
    if (post.cover_image) {
      if (post.cover_image.startsWith('http')) {
        coverImageUrl = post.cover_image;
      } else {
        coverImageUrl = `${FRONTEND_URL}${post.cover_image}`;
      }
    }

    // Generate a short snippet: prefer excerpt, otherwise strip HTML
    let snippet = '';
    if (post.excerpt && post.excerpt.trim().length > 0) {
      snippet = post.excerpt.trim();
    } else {
      snippet = post.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Twitter limit is 280 chars. Title + URL usually take ~100 chars.
    // So strictly truncate snippet to max 120 chars to be safe.
    if (snippet.length > 120) {
      snippet = snippet.slice(0, 117) + '...';
    }

    // Use AI generated social copy if available, otherwise fallback to standard snippet formatting
    const formatted_text = post.social_copy 
      ? `${post.social_copy}\n\n🔗 ${postUrl}`
      : `${post.title}\n\n${snippet}\n\n🔗 ${postUrl}`;

    const payload = {
      title: post.title,
      snippet,
      url: postUrl,
      image_url: coverImageUrl,
      locale: post.locale,
      formatted_text,
    };

    console.log(`[Make Webhook] Sending blog "${post.title}" via Cloudflare proxy...`);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (proxySecret) {
      headers['X-Proxy-Secret'] = proxySecret;
    }

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Make Webhook] Proxy returned ${response.status}: ${await response.text()}`);
    } else {
      console.log(`[Make Webhook] Successfully sent blog "${post.title}" via proxy.`);
    }
  } catch (error) {
    // Don't throw — webhook failure should never block the publish action
    console.error('[Make Webhook] Error sending webhook:', error);
  }
}
