'use client';

import React from 'react';

type TradeRow = {
  ticket?: number | null;
  symbol: string;
  direction: 'BUY' | 'SELL';
  openTime?: string | null;
  closeTime?: string | null;
  openPrice?: number | null;
  closePrice?: number | null;
  profitUsd?: number | null;
  commission?: number | null;
  swap?: number | null;
};

export default function TradesPage() {
  const [rows, setRows] = React.useState<TradeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Fetch from backend list endpoint.
        // IMPORTANT: this must hit the Express backend, not Next.js /pages/api
        // so we use NEXT_PUBLIC_API_BASE_URL (fallback to localhost).
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
        const res = await fetch(`${baseUrl}/api/trades?limit=200&offset=0`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to load trades: ${res.status} ${text}`);
        }

        const data = (await res.json()) as { items: TradeRow[] };

        if (!cancelled) setRows(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="">
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>لیست معاملات</h2>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{rows.length} ردیف</div>
          </div>

          {loading ? (
            <p style={{ marginTop: 16, color: '#6b7280', lineHeight: 1.7 }}>در حال دریافت معاملات...</p>
          ) : error ? (
            <p style={{ marginTop: 16, color: '#b91c1c', lineHeight: 1.7 }}>{error}</p>
          ) : rows.length === 0 ? (
            <p style={{ marginTop: 16, color: '#6b7280', lineHeight: 1.7 }}>
              معامله‌ای برای این حساب یافت نشد.
            </p>
          ) : null}

          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>نماد</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>جهت</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>زمان باز</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>زمان بسته</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>قیمت باز</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>قیمت بسته</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>سود (USD)</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>کمیسیون</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>سواپ</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>تیکت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, idx) => (
                  <tr key={t.ticket ?? idx}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.symbol}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>
                      {t.direction === 'BUY' ? 'خرید' : 'فروش'}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.openTime ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.closeTime ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.openPrice ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.closePrice ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.profitUsd ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.commission ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.swap ?? '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>{t.ticket ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
