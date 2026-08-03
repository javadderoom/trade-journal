import { NextResponse } from 'next/server';

/**
 * GET /api/exchange-rate
 *
 * Fetches the USD→Toman open-market rate from Navasan and returns it.
 * The response is cached by Next.js for 2 hours (7200 seconds) so we
 * stay well within the 120 req/month free quota (~4 calls/day at most).
 *
 * Response: { usdToToman: number, source: string, cachedAt: string }
 * Fallback: returns { usdToToman: 90000, source: "fallback" } on any error.
 */

// Cache the response for 6 hours (21 600 s)
// 120 free calls/month ÷ 30 days = 4 calls/day = 1 call every 6 hours
export const revalidate = 21600;

const FALLBACK_RATE = 90_000; // Tomans per USD

export async function GET() {
  try {
    // 1. Try to fetch manual override from backend DB first
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
      const dbRes = await fetch(`${backendUrl}/api/settings/exchange-rate`, { next: { revalidate: 300 } });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        if (dbData && dbData.rate && Number(dbData.rate) > 0) {
          return NextResponse.json({
            usdToToman: Number(dbData.rate),
            source: 'admin_override',
            cachedAt: new Date().toISOString(),
          });
        }
      }
    } catch (dbErr: any) {
      console.warn('[exchange-rate] Database override check failed:', dbErr.message);
    }

    // 2. Try Navasan API if key exists
    const apiKey = process.env.NAVASAN_API_KEY;

    if (apiKey) {
      try {
        const res = await fetch(
          `https://api.navasan.tech/latest/?api_key=${apiKey}&item=usd_buy`,
          { next: { revalidate: 21600 } }
        );
        if (res.ok) {
          const data = await res.json();
          const tomanValue = parseInt(data?.usd_buy?.value ?? '0', 10);
          if (tomanValue > 0) {
            return NextResponse.json({
              usdToToman: tomanValue,
              source: 'navasan',
              cachedAt: new Date().toISOString(),
            });
          }
        }
      } catch (err: any) {
        console.warn('[exchange-rate] Navasan fetch failed:', err.message);
      }
    }

    // 3. Fallback to Nobitex (USDT to Rials) which doesn't require an API key
    try {
      const res = await fetch('https://api.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls', {
        next: { revalidate: 3600 } // Cache Nobitex for 1 hour
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'ok' && data.stats['usdt-rls']) {
          const rlsValue = parseFloat(data.stats['usdt-rls'].latest);
          if (rlsValue > 0) {
            return NextResponse.json({
              usdToToman: Math.floor(rlsValue / 10), // Convert Rials to Tomans
              source: 'nobitex_fallback',
              cachedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[exchange-rate] Nobitex fallback failed:', err.message);
    }

    // 4. Ultimate Fallback
    return NextResponse.json(
      { usdToToman: FALLBACK_RATE, source: 'fallback', reason: 'all_apis_failed' },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[exchange-rate] Unexpected error:', err);
    return NextResponse.json(
      { usdToToman: FALLBACK_RATE, source: 'error_fallback', reason: err.message },
      { status: 200 }
    );
  }
}
