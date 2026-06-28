'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { useAppStore } from '../../store/useAppStore';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../../utils/farsi';
import Select from '../../components/ui/Select';
import Link from 'next/link';
import './dashboard.scss';

// ─── Types matching the /api/dashboard/summary response ────────────────────────
interface DashboardData {
  today: {
    pnl: number;
    tradeCount: number;
    wins: number;
    losses: number;
    streak: { count: number; type: 'win' | 'loss' | 'none' };
    journal: { written: boolean; mood: string | null; preview: string };
    hasTradedToday: boolean;
  };
  month: {
    equityCurve: { date: string; cumPnl: number }[];
    kpis: {
      winRate: number;
      profitFactor: number;
      avgR: number;
      maxDrawdown: number;
      totalTrades: number;
    };
    monthName: string;
    hasTrades: boolean;
  };
  edge: {
    type: 'session' | 'strategy' | 'weekday' | 'emotion' | 'fallback';
    insight: string;
    winRate: number;
    sampleSize: number;
  };
  recent: {
    trades: any[];
    journalEntry: { date: string; mood: string | null; preview: string } | null;
  };
  totalTrades: number;
}

const WEEKDAY_FULL = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { accounts, selectedAccountId, setSelectedAccountId, usdToToman, setUsdToToman } = useAppStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edgeRefreshSpin, setEdgeRefreshSpin] = useState(false);
  const [subStatus, setSubStatus] = useState<any>(null);

  const fetchSubStatus = async () => {
    try {
      const res = await api.get('/api/payments/status');
      setSubStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  };

  useEffect(() => {
    fetchSubStatus();
  }, []);

  // Fetch accounts list if not already loaded
  useEffect(() => {
    if (accounts.length === 0) {
      api
        .get('/api/trades/accounts')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            useAppStore.setState({ accounts: res.data });
          }
        })
        .catch((err) => console.error('Failed to fetch accounts:', err));
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/api/dashboard/summary?accountId=${selectedAccountId}&t=${Date.now()}`
      );
      setData(res.data);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'خطا در دریافت اطلاعات داشبورد');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fetch live USD→Toman rate
  useEffect(() => {
    fetch('/api/exchange-rate')
      .then((r) => r.json())
      .then((d) => {
        if (d?.usdToToman && d.usdToToman > 0) setUsdToToman(d.usdToToman);
      })
      .catch(() => {});
  }, [setUsdToToman]);

  // Persian today date string
  const todayJalali = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return '';
    }
  }, []);

  const accountOptions = useMemo(() => {
    const list = accounts.map((acc: any) => ({
      value: acc.id,
      label: `${acc.broker_name || 'MT5'}${acc.account_number ? ` (${acc.account_number})` : ''}`,
    }));
    return [{ value: 'all', label: 'همه حساب‌ها' }, ...list];
  }, [accounts]);

  const handleRefreshEdge = () => {
    setEdgeRefreshSpin(true);
    fetchDashboard().finally(() => {
      setTimeout(() => setEdgeRefreshSpin(false), 400);
    });
  };

  if (loading && !data) {
    return (
      <main className="dashboard-page">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <span>در حال بارگذاری داشبورد...</span>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="dashboard-page">
        <div className="dash-loading">
          <span style={{ color: '#ff5370' }}>{error || 'خطای ناشناخته'}</span>
          <button className="dash-empty-cta-btn" onClick={fetchDashboard}>
            تلاش مجدد
          </button>
        </div>
      </main>
    );
  }

  const { today, month, edge, recent, totalTrades } = data;
  const userName = user?.name || 'کاربر';
  const isNewUser = totalTrades === 0;

  return (
    <main className="dashboard-page">
      {subStatus?.plan === 'FREE' && subStatus?.usage?.monthlyTrades >= 24 && (
        <div style={{
          backgroundColor: '#ffb300',
          color: '#111319',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: 'Vazirmatn',
          fontSize: '0.9rem',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
          <span>
            {subStatus.usage.monthlyTrades >= 30
              ? 'سقف ثبت ۳۰ معامله در ماه برای پلن رایگان به پایان رسیده است. برای ثبت معامله جدید یا واردات فایل، لطفاً اشتراک خود را ارتقا دهید.'
              : `شما ${subStatus.usage.monthlyTrades} معامله از سقف ۳۰ معامله مجاز در ماه برای پلن رایگان را ثبت کرده‌اید. برای ثبت معامله بیشتر، لطفاً اشتراک خود را ارتقا دهید.`
            }
          </span>
          <Link href="/settings?tab=subscription" style={{ color: '#111319', textDecoration: 'underline', marginRight: '15px' }}>
            ارتقای اشتراک
          </Link>
        </div>
      )}
      {/* ─── Top Bar ─── */}
      <div className="dash-topbar">
        <div className="dash-greeting">
          <h1>سلام، {userName} 👋</h1>
          <span className="dash-date">{todayJalali}</span>
        </div>
        {accounts.length > 0 && (
          <div className="dash-account-selector">
            <Select
              options={accountOptions}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              placeholder="انتخاب حساب"
            />
          </div>
        )}
      </div>

      {/* ─── Section 1: Today ─── */}
      <div className="dash-section-label">امروز</div>
      <div className="dash-today-grid">
        {/* Card 1: Today's P&L */}
        <div className={`dash-card ${!today.hasTradedToday ? 'empty' : ''}`}>
          <div className="dash-card-label">سود/زیان امروز</div>
          {today.hasTradedToday ? (
            <>
              <div className={`dash-card-value ${today.pnl >= 0 ? 'positive' : 'negative'}`}>
                {today.pnl >= 0 ? '+' : ''}
                {formatPersianCurrency(today.pnl)}
              </div>
              <div className="dash-card-sub">{formatToman(today.pnl, usdToToman)}</div>
            </>
          ) : (
            <div className="dash-card-value muted">امروز معامله‌ای ندارید</div>
          )}
        </div>

        {/* Card 2: Today's Trades */}
        <div className={`dash-card ${!today.hasTradedToday ? 'empty' : ''}`}>
          <div className="dash-card-label">معاملات امروز</div>
          {today.hasTradedToday ? (
            <>
              <div className="dash-card-value white">{toPersianDigits(today.tradeCount)}</div>
              <div className="dash-card-sub">
                <div className="win-loss-split">
                  <span className="w">{toPersianDigits(today.wins)} برنده</span>
                  <span className="l">{toPersianDigits(today.losses)} بازنده</span>
                </div>
              </div>
            </>
          ) : (
            <div className="dash-card-value muted">۰</div>
          )}
        </div>

        {/* Card 3: Current Streak */}
        <div className="dash-card">
          <div className="dash-card-label">استریک فعلی</div>
          {today.streak.type === 'none' ? (
            <div className="dash-card-value muted">—</div>
          ) : (
            <div className="dash-streak">
              <span className="streak-emoji">
                {today.streak.type === 'win' ? '🔥' : '⚠️'}
              </span>
              <span className={`streak-text ${today.streak.type}`}>
                {toPersianDigits(today.streak.count)}{' '}
                {today.streak.type === 'win' ? 'برد' : 'باخت'} پشت سر هم
              </span>
            </div>
          )}
        </div>

        {/* Card 4: Journal Status */}
        <div className="dash-card">
          <div className="dash-card-label">ژورنال امروز</div>
          <div className="dash-journal-status">
            {today.journal.written ? (
              <>
                <span className="journal-status-text written">نوشته شده ✓</span>
                {today.journal.preview && (
                  <span className="journal-preview">{today.journal.preview}</span>
                )}
              </>
            ) : (
              <>
                <span className="journal-status-text not-written">هنوز ننوشتی</span>
                <button className="journal-cta" onClick={() => router.push('/journal')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    edit_note
                  </span>
                  بنویس
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Section 2: This Month ─── */}
      <div className="dash-section-label">این ماه</div>
      <div className="dash-equity-card">
        <div className="equity-header">
          <h3>منحنی سرمایه</h3>
          {month.monthName && <span className="equity-month-name">{month.monthName}</span>}
        </div>
        <div className="equity-chart-wrapper">
          {month.hasTrades && month.equityCurve.length > 0 ? (
            <EquityCurveSVG points={month.equityCurve} />
          ) : (
            <div className="dash-equity-empty">
              <div className="empty-illustration">📈</div>
              <p>اولین معاملاتت رو وارد کن تا منحنی سرمایه‌ات رو ببینی</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards — only if ≥10 trades */}
      {month.kpis.totalTrades >= 10 && (
        <div className="dash-kpi-grid">
          <KPICard
            label="نرخ موفقیت"
            value={`${toPersianDigits(month.kpis.winRate)}٪`}
            colorClass={month.kpis.winRate >= 50 ? 'gold' : 'red'}
            tooltip="درصد معاملات برنده از کل معاملات"
            points={month.equityCurve}
          />
          <KPICard
            label="ضریب سود"
            value={toPersianDigits(month.kpis.profitFactor.toFixed(2))}
            colorClass={month.kpis.profitFactor >= 1.5 ? 'green' : 'red'}
            tooltip="نسبت کل سود به کل ضرر"
            points={month.equityCurve}
          />
          <KPICard
            label="میانگین R:R"
            value={toPersianDigits(month.kpis.avgR.toFixed(2))}
            colorClass="white"
            tooltip="میانگین نسبت ریسک به ریوارد کسب‌شده"
            points={month.equityCurve}
          />
          <KPICard
            label="حداکثر افت"
            value={`$${toPersianDigits(month.kpis.maxDrawdown.toFixed(0))}`}
            colorClass="red"
            tooltip="بیشترین سقوط از قله سرمایه در این ماه"
            points={month.equityCurve}
          />
        </div>
      )}

      {/* ─── Section 3: Edge Insight ─── */}
      <div className="dash-section-label">لبه معاملاتی</div>
      <div className="dash-edge-card">
        <button
          className={`edge-refresh ${edgeRefreshSpin ? 'spinning' : ''}`}
          onClick={handleRefreshEdge}
          title="محاسبه مجدد"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            refresh
          </span>
        </button>
        <div className="edge-label">لبه معاملاتی شما</div>
        <div className="edge-sentence">{edge.insight}</div>
        <div className="edge-sub">
          بر اساس ۳۰ روز گذشته
          {edge.type !== 'fallback' && ` · ${toPersianDigits(edge.sampleSize)} معامله`}
        </div>
      </div>

      {/* ─── Section 4: Recent Activity ─── */}
      <div className="dash-section-label">فعالیت اخیر</div>
      <div className="dash-recent-grid">
        {/* Left: Last 5 trades */}
        <div className="dash-recent-card">
          <h3>آخرین معاملات</h3>
          {recent.trades.length > 0 ? (
            <>
              {recent.trades.map((t) => {
                const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);
                const isOpen = !t.closeTime;
                const r = t.rMultiple ?? 0;
                const primaryTag = Array.isArray(t.tags) && t.tags.length > 0 ? t.tags[0] : null;
                return (
                  <div key={t.id} className="dash-recent-trade-row">
                    <div className={`trade-dir-badge ${t.direction_is_buy ? 'buy' : 'sell'}`}>
                      {t.direction_is_buy ? 'B' : 'S'}
                    </div>
                    <span className="trade-symbol">{t.symbol}</span>
                    {primaryTag && <span className="trade-tag">#{primaryTag}</span>}
                    {!isOpen && (
                      <span className="trade-r">R {toPersianDigits(r.toFixed(1))}</span>
                    )}
                    <span className={`trade-pnl ${net >= 0 ? 'positive' : 'negative'}`}>
                      {isOpen ? 'باز' : `${net >= 0 ? '+' : ''}$${toPersianDigits(Math.abs(net).toFixed(0))}`}
                    </span>
                  </div>
                );
              })}
              <a className="dash-see-all" onClick={() => router.push('/trades')}>
                مشاهده همه معاملات ←
              </a>
            </>
          ) : (
            <div className="dash-empty-cta">
              <span className="material-symbols-outlined empty-icon">show_chart</span>
              <p>هنوز معامله‌ای ندارید</p>
              <button className="empty-btn" onClick={() => router.push('/trades')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  add
                </span>
                وارد کردن معامله
              </button>
            </div>
          )}
        </div>

        {/* Right: Last journal entry */}
        <div className="dash-recent-card">
          <h3>آخرین یادداشت</h3>
          {recent.journalEntry ? (
            <div className="dash-journal-preview">
              <div className="journal-date-row">
                <span className="journal-mood-emoji">
                  {recent.journalEntry.mood === 'HAPPY'
                    ? '😄'
                    : recent.journalEntry.mood === 'NEUTRAL'
                    ? '😐'
                    : recent.journalEntry.mood === 'STRESSED'
                    ? '😣'
                    : recent.journalEntry.mood === 'ANXIOUS'
                    ? '😰'
                    : recent.journalEntry.mood === 'FRUSTRATED'
                    ? '😤'
                    : '📝'}
                </span>
                <span className="journal-date">
                  {(() => {
                    try {
                      return new Intl.DateTimeFormat('fa-IR', {
                        month: 'long',
                        day: 'numeric',
                      }).format(new Date(recent.journalEntry.date));
                    } catch {
                      return '';
                    }
                  })()}
                </span>
              </div>
              <div className="journal-text">{recent.journalEntry.preview}</div>
              <a className="journal-read-more" onClick={() => router.push('/journal')}>
                ادامه مطلب ←
              </a>
            </div>
          ) : (
            <div className="dash-empty-cta">
              <span className="material-symbols-outlined empty-icon">sticky_note_2</span>
              <p>هنوز یادداشتی ننوشتی</p>
              <button className="empty-btn" onClick={() => router.push('/journal')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  edit_note
                </span>
                نوشتن ژورنال
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Inline SVG Equity Curve (no external chart dependency) ─────────────────────
function EquityCurveSVG({ points }: { points: { date: string; cumPnl: number }[] }) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = points.map((p) => p.cumPnl);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  const xStep = points.length > 1 ? chartW / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH - ((p.cumPnl - minVal) / range) * chartH;
    return { x, y, ...p };
  });

  // Build smooth path
  const linePath = coords
    .map((c, i) => (i === 0 ? `M ${c.x},${c.y}` : `L ${c.x},${c.y}`))
    .join(' ');

  // Area fill path (to zero baseline)
  const zeroY = padding.top + chartH - ((0 - minVal) / range) * chartH;
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},${zeroY} ` +
        coords.map((c) => `L ${c.x},${c.y}`).join(' ') +
        ` L ${coords[coords.length - 1].x},${zeroY} Z`
      : '';

  // Drawdown shading: from peak to curve
  let peak = -Infinity;
  const drawdownSegments: string[] = [];
  coords.forEach((c) => {
    if (c.y < peak) {
      // y is inverted (smaller y = higher value); peak tracks the highest value (lowest y)
    } else {
      peak = c.y;
    }
  });

  // X-axis labels (every nth date)
  const labelInterval = Math.max(1, Math.floor(points.length / 6));

  return (
    <svg className="equity-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="equity-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(61, 220, 151, 0.35)" />
          <stop offset="100%" stopColor="rgba(61, 220, 151, 0)" />
        </linearGradient>
        <linearGradient id="equity-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3ddc97" />
          <stop offset="100%" stopColor="#3ddc97" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + chartH * t;
        return (
          <line
            key={t}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        );
      })}

      {/* Zero line */}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={width - padding.right}
        y2={zeroY}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#equity-gradient)" />}

      {/* Line */}
      <path d={linePath} fill="none" stroke="url(#equity-line)" strokeWidth="2.5" />

      {/* X-axis date labels */}
      {coords.map((c, i) => {
        if (i % labelInterval !== 0 && i !== coords.length - 1) return null;
        const dateLabel = (() => {
          try {
            return new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(
              new Date(c.date)
            );
          } catch {
            return '';
          }
        })();
        return (
          <text
            key={i}
            x={c.x}
            y={height - 8}
            fill="#6b7280"
            fontSize="10"
            textAnchor="middle"
          >
            {dateLabel}
          </text>
        );
      })}

      {/* Last point marker */}
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="4"
          fill="#3ddc97"
          stroke="#0f1117"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

// ─── KPI Card with mini sparkline ───────────────────────────────────────────────
function KPICard({
  label,
  value,
  colorClass,
  tooltip,
  points,
}: {
  label: string;
  value: string;
  colorClass: 'gold' | 'green' | 'red' | 'white';
  tooltip: string;
  points: { date: string; cumPnl: number }[];
}) {
  // Mini sparkline from equity curve
  const sparkline = useMemo(() => {
    if (!points || points.length < 2) return null;
    const vals = points.map((p) => p.cumPnl);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const w = 80;
    const h = 20;
    const step = w / (vals.length - 1);
    const path = vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${h - ((v - min) / range) * h}`)
      .join(' ');
    return { path, w, h };
  }, [points]);

  return (
    <div className="dash-kpi-card">
      <div className={`kpi-value ${colorClass}`}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sparkline && (
        <div className="kpi-sparkline">
          <svg viewBox={`0 0 ${sparkline.w} ${sparkline.h}`} preserveAspectRatio="none">
            <path
              d={sparkline.path}
              fill="none"
              stroke="rgba(61, 220, 151, 0.5)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
      <div className="kpi-tooltip">{tooltip}</div>
    </div>
  );
}