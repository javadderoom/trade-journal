/**
 * Cloudflare Worker — Make.com Webhook Proxy
 * 
 * Deploys globally on Cloudflare's edge network, bypassing
 * geo-restrictions. Your backend sends the blog payload here,
 * and this worker forwards it to the actual Make.com webhook URL.
 * 
 * Environment variables (set in Cloudflare dashboard):
 *   MAKE_WEBHOOK_URL  — The actual Make.com webhook URL
 *   PROXY_SECRET      — A shared secret to authenticate requests
 */

export default {
  async fetch(request, env) {
    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate shared secret
    const authHeader = request.headers.get('X-Proxy-Secret');
    if (!authHeader || authHeader !== env.PROXY_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const makeWebhookUrl = env.MAKE_WEBHOOK_URL;
    if (!makeWebhookUrl) {
      return new Response('MAKE_WEBHOOK_URL not configured', { status: 500 });
    }

    try {
      const body = await request.text();

      // Forward the request to Make.com
      const makeResponse = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const responseText = await makeResponse.text();

      return new Response(responseText, {
        status: makeResponse.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, { status: 502 });
    }
  },
};
