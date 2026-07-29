'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BacktestChart, { PositionState, DrawingShape } from '../../components/backtest/BacktestChart';
import DrawingToolbar, { DrawingToolMode } from '../../components/backtest/DrawingToolbar';
import ReplayToolbar from '../../components/backtest/ReplayToolbar';
import OrderPanel, { ExecutedTrade } from '../../components/backtest/OrderPanel';
import BacktestHeader from '../../components/backtest/components/BacktestHeader';
import { useReplayEngine } from '../../components/backtest/hooks/useReplayEngine';
import { useTradingEngine } from '../../components/backtest/hooks/useTradingEngine';
import { calcSessionStats } from '../../components/backtest/utils/pnl';
import { fetchHistoricalCandles, CandleData, Timeframe } from '../../services/marketData';
import { useTranslation } from '../../store/useAppStore';
import { notify } from '../../lib/notify';
import { api } from '../../lib/api';
import '../../components/backtest/backtest.scss';

const LOCAL_STORAGE_KEY = 'tradekav_backtest_session_v1';

export default function BacktestPage() {
  const { language } = useTranslation();
  const isEn = language === 'en';

  // --- Data State ---
  const [symbol, setSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  // --- Drawing State ---
  const [activeTool, setActiveTool] = useState<DrawingToolMode>('cursor');
  const [drawings, setDrawings] = useState<DrawingShape[]>([]);

  // Refs for reading current state inside async callbacks without adding dependencies
  const candlesRef = useRef(candles);
  const visibleCountRef = useRef(0);
  const candleCacheRef = useRef<Map<string, CandleData[]>>(new Map());

  // Sync refs after render so async callbacks always see latest state
  useEffect(() => { candlesRef.current = candles; });
  useEffect(() => { visibleCountRef.current = visibleCount; });

  // --- Trading (via hook) ---
  const trading = useTradingEngine({ symbol, isEn });
  const {
    positions, balance, tradeHistory, initialBalance,
    openPosition, closePosition, closeAtMarket, updateSLTP,
    resetTrading, restoreTrading,
  } = trading;

  // --- Replay (via hook) ---
  const replay = useReplayEngine({
    candles,
    positions,
    onPositionHit: (id, price, reason, candle) => closePosition(id, price, reason, candle),
  });
  const { visibleCount, isPlaying, speed } = replay;
  const currentCandle = replay.currentCandle;
  const currentPrice = currentCandle ? currentCandle.close : 0;

  // 1. Restore LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.symbol) setSymbol(parsed.symbol);
        if (parsed.timeframe) setTimeframe(parsed.timeframe);
        if (Array.isArray(parsed.drawings)) setDrawings(parsed.drawings);
        if (typeof parsed.visibleCount === 'number') replay.loadCandles(parsed.visibleCount);
        restoreTrading({
          positions: parsed.positions,
          balance: parsed.balance,
          tradeHistory: parsed.tradeHistory,
        });
      }
    } catch (e) {
      console.warn('Could not restore backtest session:', e);
    }
  }, []);

  // 2. Persist LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        symbol, timeframe, balance, positions, tradeHistory, drawings, visibleCount,
      }));
    } catch (e) {
      console.warn('Could not save backtest session:', e);
    }
  }, [symbol, timeframe, balance, positions, tradeHistory, drawings, visibleCount]);

  // Binary search: find index of candle closest to target timestamp (O(log n))
  const findClosestCandleIndex = useCallback((data: CandleData[], targetTime: number): number => {
    let lo = 0, hi = data.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (data[mid].time < targetTime) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, []);

  // 3. Load Candles
  const loadCandleData = useCallback(async (sym: string, tf: Timeframe) => {
    // Capture current timestamp before fetch so we can map to new timeframe
    const targetTimestamp = candlesRef.current[visibleCountRef.current - 1]?.time ?? null;
    const cacheKey = `${sym}-${tf}`;

    // Check memory cache first for instant timeframe switching
    const cached = candleCacheRef.current.get(cacheKey);
    if (cached) {
      setCandles(cached);
      if (cached.length > 0) {
        if (targetTimestamp !== null) {
          const matchedIndex = findClosestCandleIndex(cached, targetTimestamp);
          replay.loadCandles(matchedIndex + 1);
        } else {
          replay.loadCandles(cached.length);
        }
      }
      return;
    }

    setIsLoadingCandles(true);
    setLoadError(false);
    try {
      const data = await fetchHistoricalCandles(sym, tf, 10000);
      candleCacheRef.current.set(cacheKey, data);
      setCandles(data);
      if (data.length > 0) {
        if (targetTimestamp !== null) {
          const matchedIndex = findClosestCandleIndex(data, targetTimestamp);
          replay.loadCandles(matchedIndex + 1);
        } else {
          replay.loadCandles(data.length);
        }
      }
    } catch (err) {
      console.error('Failed to load candles:', err);
      setLoadError(true);
      notify.error(isEn ? 'Failed to fetch historical market data' : 'خطا در دریافت داده‌های تاریخی بازار');
    } finally {
      setIsLoadingCandles(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEn]);

  useEffect(() => {
    loadCandleData(symbol, timeframe);
  }, [symbol, timeframe, loadCandleData]);

  // 4. Save Session
  const handleSaveSession = async () => {
    if (tradeHistory.length === 0) {
      notify.info(isEn ? 'Execute at least 1 trade before saving' : 'قبل از ذخیره حداقل یک معامله انجام دهید');
      return;
    }

    const stats = calcSessionStats(tradeHistory, initialBalance);

    try {
      await api.post('/api/backtest', {
        title: `${symbol} (${timeframe}) Backtest`,
        symbol, timeframe, initialBalance, finalBalance: balance,
        totalTrades: tradeHistory.length,
        ...stats,
        tradeLog: tradeHistory,
      });
      notify.success(isEn ? 'Backtest report saved!' : 'گزارش بک‌تست ذخیره شد!');
    } catch (err) {
      console.error('Failed to save backtest:', err);
      notify.error(isEn ? 'Failed to save report' : 'خطا در ذخیره گزارش');
      throw err;
    }
  };

  // 5. CSV Import
  const handleCSVImport = (parsedCandles: CandleData[]) => {
    setCandles(parsedCandles);
    replay.loadCandles(Math.min(100, parsedCandles.length));
    resetTrading();
  };

  // 6. Reset Session
  const handleReset = async () => {
    const confirmed = await notify.confirm({
      title: isEn ? 'Reset Session?' : 'بازنشانی جلسه؟',
      message: isEn
        ? 'Are you sure you want to reset all trades, balance, and drawings?'
        : 'آیا از پاک کردن تمام معاملات، موجودی و رسم‌ها اطمینان دارید؟',
      confirmLabel: isEn ? 'Reset' : 'بازنشانی',
      cancelLabel: isEn ? 'Cancel' : 'انصراف',
      danger: true,
    });
    if (!confirmed) return;

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    candleCacheRef.current.clear(); // Clear client-side memory cache
    replay.resetReplay(candles.length);
    resetTrading();
    setDrawings([]);
    notify.info(isEn ? 'Backtest session reset' : 'جلسه بک‌تست بازنشانی شد');
  };

  return (
    <div className="backtest-page-container">
      <BacktestHeader
        symbol={symbol}
        timeframe={timeframe}
        onSymbolChange={setSymbol}
        onTimeframeChange={setTimeframe}
        onSaveSession={handleSaveSession}
        onCSVImport={handleCSVImport}
      />

      <div className="backtest-workspace">
        <DrawingToolbar
          activeTool={activeTool}
          onSelectTool={(t) => setActiveTool(t)}
          onClearDrawings={() => setDrawings([])}
          isCutActive={activeTool === 'cut'}
        />

        <div className="chart-area">
          <div className="chart-wrapper">
            {isLoadingCandles ? (
              <div className="empty-history" style={{ paddingTop: '100px' }}>
                {isEn ? 'Loading historical market candles...' : 'در حال دریافت کندل‌های بازار...'}
              </div>
            ) : loadError && candles.length === 0 ? (
              <div className="load-error-card">
                <span className="material-symbols-outlined error-icon">cloud_off</span>
                <p className="error-title">
                  {isEn ? 'Market data unavailable' : 'داده بازار در دسترس نیست'}
                </p>
                <p className="error-subtitle">
                  {isEn
                    ? 'Could not connect to the data source. Check your connection and try again.'
                    : 'امکان اتصال به منبع داده وجود نداشت. اتصال خود را بررسی کرده و دوباره تلاش کنید.'}
                </p>
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => loadCandleData(symbol, timeframe)}
                >
                  <span className="material-symbols-outlined">refresh</span>
                  {isEn ? 'Retry' : 'تلاش مجدد'}
                </button>
              </div>
            ) : (
              <BacktestChart
                candles={candles}
                symbol={symbol}
                visibleCount={visibleCount}
                positions={positions}
                activeDrawingTool={activeTool}
                onCutBarSelect={(barIdx) => {
                  replay.jumpToBar(barIdx);
                  setActiveTool('cursor');
                  notify.success(isEn ? `Cut replay to candle #${barIdx}` : `نقطه شروع ریپلی روی کندل #${barIdx} تنظیم شد`);
                }}
                drawings={drawings}
                onDrawingsChange={setDrawings}
                onUpdateSLTP={updateSLTP}
              />
            )}
          </div>

          <ReplayToolbar
            isPlaying={isPlaying}
            onTogglePlay={() => replay.setIsPlaying((prev: boolean) => !prev)}
            onStepForward={replay.stepForward}
            onStepBackward={() => replay.jumpToBar(Math.max(0, visibleCount - 1))}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={replay.setSpeed}
            currentBarIndex={visibleCount}
            totalBars={candles.length}
            onJumpToBar={replay.jumpToBar}
          />
        </div>

        <div className="order-sidebar">
          <OrderPanel
            symbol={symbol}
            currentPrice={currentPrice}
            balance={balance}
            positions={positions}
            tradeHistory={tradeHistory}
            isLoading={isLoadingCandles}
            onOpenPosition={(type, lots, sl, tp) => openPosition(type, lots, sl, tp, currentPrice)}
            onClosePosition={(id, reason) => closeAtMarket(id, currentPrice, reason || 'MANUAL', currentCandle)}
            onUpdateSLTP={updateSLTP}
          />
        </div>
      </div>
    </div>
  );
}
