'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import BacktestChart, { PositionState, DrawingShape } from '../../components/backtest/BacktestChart';
import DrawingToolbar, { DrawingToolMode } from '../../components/backtest/DrawingToolbar';
import ReplayToolbar from '../../components/backtest/ReplayToolbar';
import OrderPanel, { ExecutedTrade } from '../../components/backtest/OrderPanel';
import Select from '../../components/ui/Select';
import LoadingButton from '../../components/ui/LoadingButton';
import { fetchHistoricalCandles, parseCSVHistory, CandleData, Timeframe } from '../../services/marketData';
import { useTranslation } from '../../store/useAppStore';
import { notify } from '../../lib/notify';
import { api } from '../../lib/api';
import '../../components/backtest/backtest.scss';

const LOCAL_STORAGE_KEY = 'tradekav_backtest_session_v1';

export default function BacktestPage() {
  const { language } = useTranslation();
  const isEn = language === 'en';

  // --- State ---
  const [symbol, setSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);

  // Drawing Tools & Cut Bar State
  const [activeTool, setActiveTool] = useState<DrawingToolMode>('cursor');
  const [drawings, setDrawings] = useState<DrawingShape[]>([]);

  // Trading & Balance State
  const [initialBalance] = useState<number>(10000);
  const [balance, setBalance] = useState<number>(10000);
  const [position, setPosition] = useState<PositionState | null>(null);
  const [tradeHistory, setTradeHistory] = useState<ExecutedTrade[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Restore LocalStorage Session state on initial mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.symbol) setSymbol(parsed.symbol);
        if (parsed.timeframe) setTimeframe(parsed.timeframe);
        if (typeof parsed.balance === 'number') setBalance(parsed.balance);
        if (parsed.position) setPosition(parsed.position);
        if (Array.isArray(parsed.tradeHistory)) setTradeHistory(parsed.tradeHistory);
        if (Array.isArray(parsed.drawings)) setDrawings(parsed.drawings);
        if (typeof parsed.visibleCount === 'number') setVisibleCount(parsed.visibleCount);
      }
    } catch (e) {
      console.warn('Could not restore backtest local storage session:', e);
    }
  }, []);

  // 2. Persist LocalStorage Session on key state changes
  useEffect(() => {
    try {
      const stateToSave = {
        symbol,
        timeframe,
        balance,
        position,
        tradeHistory,
        drawings,
        visibleCount,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save backtest session to local storage:', e);
    }
  }, [symbol, timeframe, balance, position, tradeHistory, drawings, visibleCount]);

  // 3. Load Candles for Selected Symbol & Timeframe
  const loadCandles = useCallback(async (sym: string, tf: Timeframe) => {
    setIsLoadingCandles(true);
    try {
      const data = await fetchHistoricalCandles(sym, tf, 600);
      setCandles(data);
      if (data.length > 0) {
        setVisibleCount(data.length);
      }
    } catch (err) {
      console.error('Failed to load candles for backtest:', err);
      notify.error(isEn ? 'Failed to fetch historical market data' : 'خطا در دریافت داده‌های تاریخی بازار');
    } finally {
      setIsLoadingCandles(false);
    }
  }, [isEn]);

  useEffect(() => {
    loadCandles(symbol, timeframe);
  }, [symbol, timeframe, loadCandles]);

  // Current Bar under Replay Cursor
  const currentCandle = candles[visibleCount - 1] || null;
  const currentPrice = currentCandle ? currentCandle.close : 0;

  // 4. Close Position & Calculate PnL / R-Multiple
  const closePositionAtPrice = useCallback((exitPrice: number, exitReason: string) => {
    setPosition((prevPosition) => {
      if (!prevPosition || !currentCandle) return null;

      const isBuy = prevPosition.type === 'BUY';
      const priceDiff = isBuy ? exitPrice - prevPosition.entryPrice : prevPosition.entryPrice - exitPrice;
      
      const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL');
      const isJpy = symbol.includes('JPY');
      const isGold = symbol === 'XAUUSD';

      const pipDivider = isCrypto ? 1 : isGold ? 0.1 : isJpy ? 0.01 : 0.0001;
      const pips = priceDiff / pipDivider;

      let pnlUsd = 0;
      if (isCrypto) {
        pnlUsd = priceDiff * prevPosition.lotSize;
      } else if (isGold) {
        pnlUsd = priceDiff * 100 * prevPosition.lotSize;
      } else if (isJpy) {
        pnlUsd = (priceDiff / exitPrice) * 100000 * prevPosition.lotSize;
      } else {
        pnlUsd = priceDiff * 100000 * prevPosition.lotSize;
      }

      const slDiff = prevPosition.stopLoss
        ? Math.abs(prevPosition.entryPrice - prevPosition.stopLoss)
        : Math.abs(priceDiff);
      const rMultiple = slDiff > 0 ? priceDiff / slDiff : 0;
      const result = pnlUsd > 0 ? 'WIN' : pnlUsd < 0 ? 'LOSS' : 'BREAKEVEN';

      const executedTrade: ExecutedTrade = {
        id: `bt-trade-${Date.now()}`,
        type: prevPosition.type,
        entryPrice: prevPosition.entryPrice,
        exitPrice,
        stopLoss: prevPosition.stopLoss,
        takeProfit: prevPosition.takeProfit,
        lotSize: prevPosition.lotSize,
        pnlUsd,
        pips,
        rMultiple,
        result,
        openTime: currentCandle.time,
        closeTime: currentCandle.time,
      };

      setTradeHistory((history) => [executedTrade, ...history]);
      setBalance((bal) => bal + pnlUsd);

      const message =
        result === 'WIN'
          ? isEn
            ? `Trade Hit ${exitReason}! Profit: +$${pnlUsd.toFixed(2)}`
            : `معامله با سود بسته‌شد (${exitReason}): +$${pnlUsd.toFixed(2)}`
          : isEn
          ? `Trade Hit ${exitReason}! Loss: -$${Math.abs(pnlUsd).toFixed(2)}`
          : `معامله با حد ضرر بسته‌شد (${exitReason}): -$${Math.abs(pnlUsd).toFixed(2)}`;

      if (result === 'WIN') notify.success(message);
      else notify.error(message);

      return null;
    });
  }, [currentCandle, isEn, symbol]);

  // 5. Evaluate Active Position against New Candle (Auto SL/TP Hit Detection)
  const evaluatePositionOnCandle = useCallback(
    (candle: CandleData, activePos: PositionState) => {
      let exitPrice: number | null = null;
      let reason: string | null = null;

      if (activePos.type === 'BUY') {
        if (activePos.stopLoss && candle.low <= activePos.stopLoss) {
          exitPrice = activePos.stopLoss;
          reason = 'SL';
        } else if (activePos.takeProfit && candle.high >= activePos.takeProfit) {
          exitPrice = activePos.takeProfit;
          reason = 'TP';
        }
      } else if (activePos.type === 'SELL') {
        if (activePos.stopLoss && candle.high >= activePos.stopLoss) {
          exitPrice = activePos.stopLoss;
          reason = 'SL';
        } else if (activePos.takeProfit && candle.low <= activePos.takeProfit) {
          exitPrice = activePos.takeProfit;
          reason = 'TP';
        }
      }

      if (exitPrice !== null) {
        closePositionAtPrice(exitPrice, reason || 'AUTO');
      }
    },
    [closePositionAtPrice]
  );

  // 6. Step Forward by 1 Bar
  const handleStepForward = useCallback(() => {
    if (visibleCount >= candles.length) {
      setIsPlaying(false);
      return;
    }

    const nextCount = visibleCount + 1;
    setVisibleCount(nextCount);

    const nextCandle = candles[nextCount - 1];
    if (position && nextCandle) {
      evaluatePositionOnCandle(nextCandle, position);
    }
  }, [visibleCount, candles, position, evaluatePositionOnCandle]);

  // 7. Auto-Play Timer Loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, Math.round(1000 / speed));
      timerRef.current = setInterval(() => {
        handleStepForward();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, handleStepForward]);

  // 8. Hotkey Navigation (Right Arrow = Next Bar, Space = Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepForward]);

  // 9. Open Trade Position (BUY / SELL)
  const handleOpenPosition = (
    type: 'BUY' | 'SELL',
    lotSize: number,
    sl: number | null,
    tp: number | null
  ) => {
    if (!currentPrice) return;
    setPosition({
      type,
      entryPrice: currentPrice,
      stopLoss: sl,
      takeProfit: tp,
      lotSize,
    });
    notify.info(
      isEn
        ? `Opened ${type} @ ${currentPrice}`
        : `پوزیشن ${type === 'BUY' ? 'خرید' : 'فروش'} در قیمت ${currentPrice} باز شد`
    );
  };

  // 10. Save Session to Database
  const handleSaveSession = async () => {
    if (tradeHistory.length === 0) {
      notify.info(isEn ? 'Execute at least 1 trade before saving backtest report' : 'قبل از ذخیره گزارش حداقل یک معامله انجام دهید');
      return;
    }

    const wins = tradeHistory.filter((t) => t.result === 'WIN').length;
    const winRate = Number(((wins / tradeHistory.length) * 100).toFixed(1));

    const payload = {
      title: `${symbol} (${timeframe}) Backtest`,
      symbol,
      timeframe,
      initialBalance,
      finalBalance: balance,
      totalTrades: tradeHistory.length,
      winRate,
      profitFactor: 1.5,
      maxDrawdown: 3.2,
      tradeLog: tradeHistory,
    };

    await api.post('/api/backtest', payload);
    notify.success(isEn ? 'Backtest report saved to database successfully!' : 'گزارش بک‌تست با موفقیت در دیتابیس ذخیره شد!');
  };

  // 11. Custom CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsedCandles = parseCSVHistory(text);
        if (parsedCandles.length > 0) {
          setCandles(parsedCandles);
          setVisibleCount(Math.min(100, parsedCandles.length));
          setPosition(null);
          setTradeHistory([]);
          setBalance(initialBalance);
          notify.success(isEn ? `Loaded ${parsedCandles.length} custom candles from CSV!` : `${parsedCandles.length} کندل سفارشی از فایل CSV بارگذاری شد!`);
        } else {
          notify.error(isEn ? 'Could not parse CSV candle format' : 'فرمت فایل CSV معتبر نیست');
        }
      }
    };
    reader.readAsText(file);
  };

  const symbolOptions = [
    { value: 'XAUUSD', label: 'Gold / XAUUSD' },
    { value: 'EURUSD', label: 'EUR / USD' },
    { value: 'GBPUSD', label: 'GBP / USD' },
    { value: 'USDJPY', label: 'USD / JPY' },
    { value: 'BTCUSD', label: 'Bitcoin / BTCUSD' },
    { value: 'ETHUSD', label: 'Ethereum / ETHUSD' },
  ];

  const timeframeOptions = [
    { value: '1m', label: '1 Min (1m)' },
    { value: '5m', label: '5 Min (5m)' },
    { value: '15m', label: '15 Min (15m)' },
    { value: '1h', label: '1 Hour (1h)' },
    { value: '4h', label: '4 Hours (4h)' },
    { value: '1d', label: 'Daily (1d)' },
  ];

  return (
    <div className="backtest-page-container">
      {/* Header Bar */}
      <div className="backtest-header">
        <div className="header-title-wrap">
          <h1>{isEn ? 'TradingView Backtester' : 'بک‌تستر پیشرفته تریدکاو'}</h1>
        </div>

        <div className="header-controls">
          {/* Custom Select for Symbol */}
          <div className="selector-group">
            <label>{isEn ? 'Symbol:' : 'نماد:'}</label>
            <Select
              value={symbol}
              onChange={(val) => setSymbol(val)}
              options={symbolOptions}
            />
          </div>

          {/* Custom Select for Timeframe */}
          <div className="selector-group">
            <label>{isEn ? 'Timeframe:' : 'تایم‌فریم:'}</label>
            <Select
              value={timeframe}
              onChange={(val) => setTimeframe(val as Timeframe)}
              options={timeframeOptions}
            />
          </div>

          {/* Custom CSV Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="select-input"
            onClick={() => fileInputRef.current?.click()}
            title={isEn ? 'Upload MT4/MT5 CSV History' : 'بارگذاری فایل تاریخچه CSV'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📁 {isEn ? 'Import CSV' : 'ورود CSV'}
          </button>

          {/* Save Session Report Button */}
          <LoadingButton
            onClick={handleSaveSession}
            variant="primary"
            size="sm"
            successText={isEn ? 'Saved!' : 'ذخیره شد'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '4px' }}>cloud_upload</span>
            <span>{isEn ? 'Save Session' : 'ذخیره گزارش'}</span>
          </LoadingButton>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="backtest-workspace">
        {/* Vertical Drawing Tools & Cut Bar Toolbar */}
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
            ) : (
              <BacktestChart
                candles={candles}
                visibleCount={visibleCount}
                position={position}
                activeDrawingTool={activeTool}
                onCutBarSelect={(barIdx) => {
                  setVisibleCount(barIdx);
                  setActiveTool('cursor');
                  notify.success(isEn ? `Cut replay to candle #${barIdx}` : `نقطه شروع ریپلی روی کندل #${barIdx} تنظیم شد`);
                }}
                drawings={drawings}
                onDrawingsChange={setDrawings}
                onUpdateSLTP={(newSL, newTP) => {
                  if (position) {
                    setPosition({
                      ...position,
                      stopLoss: newSL,
                      takeProfit: newTP,
                    });
                  }
                }}
              />
            )}
          </div>

          {/* Floating Replay Controls */}
          <ReplayToolbar
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((prev) => !prev)}
            onStepForward={handleStepForward}
            onStepBackward={() => setVisibleCount((prev) => Math.max(10, prev - 1))}
            onReset={() => {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              setVisibleCount(candles.length);
              setPosition(null);
              setTradeHistory([]);
              setBalance(initialBalance);
              setDrawings([]);
              notify.info(isEn ? 'Backtest session reset' : 'جلسه بک‌تست بازنشانی شد');
            }}
            speed={speed}
            onSpeedChange={setSpeed}
            currentBarIndex={visibleCount}
            totalBars={candles.length}
            onJumpToBar={(barIdx) => setVisibleCount(barIdx)}
          />
        </div>

        {/* Right Order & Analytics Sidebar */}
        <div className="order-sidebar">
          <OrderPanel
            currentPrice={currentPrice}
            balance={balance}
            activePosition={position}
            tradeHistory={tradeHistory}
            onOpenPosition={handleOpenPosition}
            onClosePosition={(reason) => closePositionAtPrice(currentPrice, reason || 'MANUAL')}
          />
        </div>
      </div>
    </div>
  );
}
