'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore, useTranslation } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import Select from '../../components/ui/Select';
import { toPersianDigits, formatToman, formatNum } from '../../utils/farsi';
import { formatCurrency, getTradingSession, getMainPair, getEmotionEmoji, getEmotionLabel } from '../../utils/tradeHelpers';
import { WEEKDAY_NAMES_FA, WEEKDAY_NAMES_EN } from '../../constants/dates';
import { useTradesTags } from '../../hooks/useTradesTags';
import { useTradesEmotions } from '../../hooks/useTradesEmotions';
import '../../components/journal/journal.scss';
import EquityChart from '../../components/journal/EquityChart';
import WeekdayPnlChart from '../../components/journal/WeekdayPnlChart';
import TradingCalendar from '../../components/journal/TradingCalendar';

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'charts'>('overview');
  const { t, language } = useTranslation();

  const getSessionLabel = (label: string) => {
    if (language === 'en') {
      const enSessMap: { [key: string]: string } = {
        'سیدنی': 'Sydney',
        'توکیو': 'Tokyo',
        'لندن': 'London',
        'نیویورک': 'New York',
      };
      return enSessMap[label] || label;
    }
    return label;
  };

  const weekdayNames = language === 'fa'
    ? WEEKDAY_NAMES_FA
    : WEEKDAY_NAMES_EN;

  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    usdToToman,
  } = useAppStore();

  const {
    trades,
    loading,
    fetchTrades,
  } = useTradeStore();

  const [ignoredTags, setIgnoredTags] = useState<Set<string>>(new Set<string>());
  const [customEmotions, setCustomEmotions] = useState<{ value: string; label: string; emoji?: string }[]>([]);

  // Load trades and accounts if empty
  useEffect(() => {
    fetchTrades(false, selectedAccountId);
  }, [selectedAccountId]);

  const { tags: fetchedTags } = useTradesTags();
  useEffect(() => {
    if (Array.isArray(fetchedTags)) {
      const ignored = new Set<string>();
      fetchedTags.forEach((tag: any) => {
        if (tag.is_ignored) ignored.add(tag.name);
      });
      setIgnoredTags(ignored);
    }
  }, [fetchedTags]);

  const { emotions: fetchedEmotions } = useTradesEmotions();
  useEffect(() => {
    if (Array.isArray(fetchedEmotions)) {
      setCustomEmotions(fetchedEmotions);
    }
  }, [fetchedEmotions]);

  // Compute Statistics (Tier 1 & Tier 2)
  const stats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.closeTime !== null && t.closePrice !== null && !t.tags?.some(tag => ignoredTags.has(tag)));
    const totalCount = closedTrades.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        winRateOverall: 0,
        winRateBuy: 0,
        winRateSell: 0,
        profitFactor: 0,
        avgRPlanned: 0,
        avgRAchieved: 0,
        expectancyUsd: 0,
        grossPnl: 0,
        netPnl: 0,
        commissions: 0,
        swaps: 0,
        maxDrawdown: 0,
        maxConsecutiveLosses: 0,
        totalWinners: 0,
        totalLosers: 0,
        // Tier 2 defaults
        sessions: [],
        symbols: [],
        strategies: [],
        weekdays: [],
        hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, pnl: 0, count: 0, className: '' })),
        emotions: [],
        timeframeMatrix: {},
      };
    }

    // ─── TIER 1 CALCULATIONS ────────────────────────────────────────────────

    const winners = closedTrades.filter((t) => t.profitUsd > 0);
    const losers = closedTrades.filter((t) => t.profitUsd <= 0);
    const winRateOverall = (winners.length / totalCount) * 100;

    const buyTrades = closedTrades.filter((t) => t.direction === 'BUY');
    const buyWinners = buyTrades.filter((t) => t.profitUsd > 0);
    const winRateBuy = buyTrades.length > 0 ? (buyWinners.length / buyTrades.length) * 100 : 0;

    const sellTrades = closedTrades.filter((t) => t.direction === 'SELL');
    const sellWinners = sellTrades.filter((t) => t.profitUsd > 0);
    const winRateSell = sellTrades.length > 0 ? (sellWinners.length / sellTrades.length) * 100 : 0;

    const grossProfit = winners.reduce((sum, t) => sum + t.profitUsd, 0);
    const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.profitUsd, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;

    const netPnl = closedTrades.reduce((sum, t) => sum + t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0), 0);
    const expectancyUsd = netPnl / totalCount;

    const grossPnl = closedTrades.reduce((sum, t) => sum + t.profitUsd, 0);
    const commissions = closedTrades.reduce((sum, t) => sum + (t.commission ?? 0), 0);
    const swaps = closedTrades.reduce((sum, t) => sum + (t.swap ?? 0), 0);

    // R-Multiple Analysis (only for trades with SL and TP)
    const tradesWithRiskSetup = closedTrades.filter((t) => {
      const isBuy = t.direction === 'BUY';
      return (
        t.stopLoss !== null &&
        t.stopLoss > 0 &&
        t.openPrice > 0 &&
        t.takeProfit !== null &&
        t.takeProfit > 0
      );
    });

    let sumRPlanned = 0;
    let sumRAchieved = 0;

    tradesWithRiskSetup.forEach((t) => {
      const isBuy = t.direction === 'BUY';
      const risk = isBuy ? t.openPrice - t.stopLoss! : t.stopLoss! - t.openPrice;
      const targetReward = isBuy ? t.takeProfit! - t.openPrice : t.openPrice - t.takeProfit!;
      
      if (risk > 0) {
        sumRPlanned += targetReward / risk;
        sumRAchieved += t.rMultiple ?? 0;
      }
    });

    const avgRPlanned = tradesWithRiskSetup.length > 0 ? sumRPlanned / tradesWithRiskSetup.length : 0;
    const avgRAchieved = tradesWithRiskSetup.length > 0 ? sumRAchieved / tradesWithRiskSetup.length : 0;

    // Max Drawdown & Max Consecutive Losses (Requires chronological sorting)
    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime()
    );

    let peak = 0;
    let maxDrawdown = 0;
    let runningNetSum = 0;

    let maxConsecutiveLosses = 0;
    let currentLossStreak = 0;

    sortedTrades.forEach((t) => {
      const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);
      runningNetSum += net;

      // Drawdown
      if (runningNetSum > peak) {
        peak = runningNetSum;
      }
      const dd = peak - runningNetSum;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }

      // Consecutive streak
      if (net < 0) {
        currentLossStreak++;
        if (currentLossStreak > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentLossStreak;
        }
      } else if (net > 0) {
        currentLossStreak = 0;
      }
    });

    // ─── TIER 2 PATTERN RECOGNITION CALCULATIONS ────────────────────────────

    // Helpers to populate groupings
    const sessionsGroup: { [key: string]: { label: string; emoji: string; pnl: number; wins: number; total: number } } = {};
    const symbolsGroup: { [key: string]: { pnl: number; wins: number; total: number } } = {};
    const strategiesGroup: { [key: string]: { pnl: number; wins: number; total: number } } = {};
    const weekdaysGroup: { [key: number]: { pnl: number; wins: number; total: number } } = {};
    const hoursPnl = Array.from({ length: 24 }, () => ({ pnl: 0, count: 0 }));
    const emotionsGroup: { [key: string]: { pnl: number; wins: number; total: number } } = {};

    const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
    const timeframeMatrix: Record<string, Record<string, { wins: number; total: number; pnl: number }>> = {};
    TIMEFRAMES.forEach(a => {
      timeframeMatrix[a] = {};
      TIMEFRAMES.forEach(e => {
        timeframeMatrix[a][e] = { wins: 0, total: 0, pnl: 0 };
      });
    });

    closedTrades.forEach((t) => {
      const isWin = t.profitUsd > 0;
      const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);

      // A. Session
      const sessionInfo = getTradingSession(t.openTime);
      const sessionKey = sessionInfo.name;
      if (!sessionsGroup[sessionKey]) {
        sessionsGroup[sessionKey] = {
          label: sessionInfo.label,
          emoji: sessionInfo.emoji,
          pnl: 0,
          wins: 0,
          total: 0,
        };
      }
      sessionsGroup[sessionKey].pnl += net;
      sessionsGroup[sessionKey].total += 1;
      if (isWin) sessionsGroup[sessionKey].wins += 1;

      // B. Symbol
      const mainPair = getMainPair(t.symbol);
      if (!symbolsGroup[mainPair]) {
        symbolsGroup[mainPair] = { pnl: 0, wins: 0, total: 0 };
      }
      symbolsGroup[mainPair].pnl += net;
      symbolsGroup[mainPair].total += 1;
      if (isWin) symbolsGroup[mainPair].wins += 1;

      // C. Strategy / Tags
      const tags = Array.isArray(t.tags) ? t.tags : [];
      tags.forEach((tag) => {
        if (!strategiesGroup[tag]) {
          strategiesGroup[tag] = { pnl: 0, wins: 0, total: 0 };
        }
        strategiesGroup[tag].pnl += net;
        strategiesGroup[tag].total += 1;
        if (isWin) strategiesGroup[tag].wins += 1;
      });

      // D. Day of Week
      const dayIdx = new Date(t.openTime).getDay();
      if (!weekdaysGroup[dayIdx]) {
        weekdaysGroup[dayIdx] = { pnl: 0, wins: 0, total: 0 };
      }
      weekdaysGroup[dayIdx].pnl += net;
      weekdaysGroup[dayIdx].total += 1;
      if (isWin) weekdaysGroup[dayIdx].wins += 1;

      // E. Hour of Day (Tehran timezone)
      let hour = 0;
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Tehran',
          hour: '2-digit',
          hour12: false,
        });
        hour = parseInt(formatter.format(new Date(t.openTime)), 10) % 24;
      } catch {
        hour = new Date(t.openTime).getHours();
      }
      hoursPnl[hour].pnl += net;
      hoursPnl[hour].count += 1;

      // F. Emotion
      const emo = t.emotion || 'UNKNOWN';
      if (!emotionsGroup[emo]) {
        emotionsGroup[emo] = { pnl: 0, wins: 0, total: 0 };
      }
      emotionsGroup[emo].pnl += net;
      emotionsGroup[emo].total += 1;
      if (isWin) emotionsGroup[emo].wins += 1;

      // G. Timeframes
      const aTf = t.analysisTimeframe;
      const eTf = t.entryTimeframe;
      if (aTf && eTf && timeframeMatrix[aTf] && timeframeMatrix[aTf][eTf]) {
        timeframeMatrix[aTf][eTf].total += 1;
        timeframeMatrix[aTf][eTf].pnl += net;
        if (isWin) timeframeMatrix[aTf][eTf].wins += 1;
      }
    });

    // Format Session lists
    const sessionsList = Object.keys(sessionsGroup).map((key) => ({
      name: key,
      ...sessionsGroup[key],
      winRate: (sessionsGroup[key].wins / sessionsGroup[key].total) * 100,
    })).sort((a, b) => b.pnl - a.pnl);

    // Format Symbol lists
    const symbolsList = Object.keys(symbolsGroup).map((sym) => ({
      symbol: sym,
      ...symbolsGroup[sym],
      winRate: (symbolsGroup[sym].wins / symbolsGroup[sym].total) * 100,
    })).sort((a, b) => b.total - a.total);

    // Format Strategy lists
    const strategiesList = Object.keys(strategiesGroup).map((tag) => ({
      tag,
      ...strategiesGroup[tag],
      winRate: (strategiesGroup[tag].wins / strategiesGroup[tag].total) * 100,
    })).sort((a, b) => b.pnl - a.pnl);

    // Format Weekday lists
    const weekdaysList = Object.keys(weekdaysGroup).map((idxStr) => {
      const idx = parseInt(idxStr, 10);
      return {
        dayIndex: idx,
        name: weekdayNames[idx],
        ...weekdaysGroup[idx],
        winRate: (weekdaysGroup[idx].wins / weekdaysGroup[idx].total) * 100,
      };
    }).sort((a, b) => a.dayIndex - b.dayIndex);

    // Format Emotion lists
    const emotionsList = Object.keys(emotionsGroup).map((key) => {
      const foundCustom = customEmotions.find(e => e.value === key);
      return {
        name: key,
        label: foundCustom?.label || getEmotionLabel(key) || key,
        emoji: foundCustom?.emoji || getEmotionEmoji(key),
        ...emotionsGroup[key],
        winRate: (emotionsGroup[key].wins / emotionsGroup[key].total) * 100,
        avgPnl: emotionsGroup[key].pnl / emotionsGroup[key].total,
      };
    }).sort((a, b) => b.pnl - a.pnl);

    // Format Hourly Heatmap & find max limits for opacity scaling
    const maxProfitHour = Math.max(...hoursPnl.map((h) => h.pnl), 1);
    const maxLossHour = Math.max(...hoursPnl.map((h) => Math.abs(h.pnl)), 1);

    const hoursList = hoursPnl.map((h, hourIdx) => {
      let className = '';
      if (h.count > 0) {
        if (h.pnl > 0) {
          const strength = Math.min(Math.ceil((h.pnl / maxProfitHour) * 4), 4);
          className = `heat-profit-${strength}`;
        } else if (h.pnl < 0) {
          const strength = Math.min(Math.ceil((Math.abs(h.pnl) / maxLossHour) * 4), 4);
          className = `heat-loss-${strength}`;
        }
      }
      return {
        hour: hourIdx,
        pnl: h.pnl,
        count: h.count,
        className,
      };
    });

    return {
      totalCount,
      winRateOverall,
      winRateBuy,
      winRateSell,
      profitFactor,
      avgRPlanned,
      avgRAchieved,
      expectancyUsd,
      grossPnl,
      netPnl,
      commissions,
      swaps,
      maxDrawdown,
      maxConsecutiveLosses,
      totalWinners: winners.length,
      totalLosers: losers.length,
      // Tier 2 metrics
      sessions: sessionsList,
      symbols: symbolsList,
      strategies: strategiesList,
      weekdays: weekdaysList,
      hours: hoursList,
      emotions: emotionsList,
      timeframeMatrix,
    };
  }, [trades, ignoredTags]);

  // ─── TIER 3 CHARTS & RISK CALCULATIONS ───────────────────────────────────

  const sortedClosedTrades = useMemo(() => {
    return [...trades]
      .filter((t) => t.closeTime !== null && t.closePrice !== null && !t.tags?.some(tag => ignoredTags.has(tag)))
      .sort((a, b) => new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime());
  }, [trades, ignoredTags]);





  const rDistribution = useMemo(() => {
    const bins = language === 'fa' ? [
      { key: 'loss', label: 'ضرر (R < 0)', count: 0, className: 'bin-loss' },
      { key: 'small-win', label: 'برد کوچک (0 ≤ R < 1)', count: 0, className: 'bin-small-win' },
      { key: 'med-win', label: 'برد متوسط (1 ≤ R < 2)', count: 0, className: 'bin-med-win' },
      { key: 'target-win', label: 'برد هدف (2 ≤ R < 3)', count: 0, className: 'bin-target-win' },
      { key: 'big-win', label: 'برد بزرگ (R ≥ 3)', count: 0, className: 'bin-big-win' },
    ] : [
      { key: 'loss', label: 'Loss (R < 0)', count: 0, className: 'bin-loss' },
      { key: 'small-win', label: 'Small Win (0 ≤ R < 1)', count: 0, className: 'bin-small-win' },
      { key: 'med-win', label: 'Medium Win (1 ≤ R < 2)', count: 0, className: 'bin-med-win' },
      { key: 'target-win', label: 'Target Win (2 ≤ R < 3)', count: 0, className: 'bin-target-win' },
      { key: 'big-win', label: 'Big Win (R ≥ 3)', count: 0, className: 'bin-big-win' },
    ];

    sortedClosedTrades.forEach((t) => {
      const r = t.rMultiple ?? 0;
      if (r < 0) {
        bins[0].count += 1;
      } else if (r >= 0 && r < 1) {
        bins[1].count += 1;
      } else if (r >= 1 && r < 2) {
        bins[2].count += 1;
      } else if (r >= 2 && r < 3) {
        bins[3].count += 1;
      } else {
        bins[4].count += 1;
      }
    });

    const total = sortedClosedTrades.length || 1;
    const maxCount = Math.max(...bins.map((b) => b.count), 1);

    return bins.map((b) => ({
      ...b,
      percentage: (b.count / total) * 100,
      relativeWidth: (b.count / maxCount) * 100
    }));
  }, [sortedClosedTrades]);

  const comparisons = useMemo(() => {
    const closedWinners = sortedClosedTrades.filter((t) => {
      const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);
      return net > 0;
    });
    const closedLosers = sortedClosedTrades.filter((t) => {
      const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);
      return net < 0;
    });

    const totalWinnerPnl = closedWinners.reduce((sum, t) => sum + (t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0)), 0);
    const totalLoserPnl = Math.abs(closedLosers.reduce((sum, t) => sum + (t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0)), 0));

    const avgWinnerUsd = closedWinners.length > 0 ? totalWinnerPnl / closedWinners.length : 0;
    const avgLoserUsd = closedLosers.length > 0 ? totalLoserPnl / closedLosers.length : 0;

    const totalWinnerPips = closedWinners.reduce((sum, t) => sum + (t.pips ?? 0), 0);
    const totalLoserPips = Math.abs(closedLosers.reduce((sum, t) => sum + (t.pips ?? 0), 0));

    const avgWinnerPips = closedWinners.length > 0 ? totalWinnerPips / closedWinners.length : 0;
    const avgLoserPips = closedLosers.length > 0 ? totalLoserPips / closedLosers.length : 0;

    const winLossRatio = avgLoserUsd > 0 ? avgWinnerUsd / avgLoserUsd : 0;

    return {
      avgWinnerUsd,
      avgLoserUsd,
      avgWinnerPips,
      avgLoserPips,
      winLossRatio,
      winnersCount: closedWinners.length,
      losersCount: closedLosers.length
    };
  }, [sortedClosedTrades]);

  // Account selector dropdown list options
  const accountOptions = useMemo(() => {
    const list = accounts.map((acc) => ({
      value: acc.id,
      label: acc.name + (acc.accountNumber ? ` (${acc.accountNumber})` : ''),
    }));
    return [{ value: 'all', label: language === 'fa' ? 'همه حساب‌ها' : 'All Accounts' }, ...list];
  }, [accounts, language]);

  // Helper formatting values
  const isNetProfit = stats.netPnl >= 0;
  const radialDashOffset = 251.2 - (251.2 * stats.winRateOverall) / 100;

  return (
    <div className="journal-container">
      {/* Header */}
      <header className="journal-header">
        <h1>{t('analytics.title')}</h1>
        <div className="header-actions">
          <Select
            options={accountOptions}
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            placeholder={language === 'fa' ? 'انتخاب حساب' : 'Select Account'}
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="journal-tab-bar">
        {([
          { key: 'overview' as const, label: t('analytics.overview'), icon: 'analytics' },
          { key: 'patterns' as const, label: t('analytics.patterns'), icon: 'hub' },
          { key: 'charts' as const, label: t('analytics.charts'), icon: 'candlestick_chart' },
        ]).map((tab) => (
          <button
            key={tab.key}
            className={`journal-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {stats.totalCount === 0 ? (
        <div className="journal-empty-state">
          <span className="material-symbols-outlined empty-icon">analytics</span>
          <h3>{t('analytics.noDataTitle')}</h3>
          <p>{t('analytics.noDataDesc')}</p>
        </div>
      ) : activeTab === 'overview' ? (
        /* Overview (Tier 1) Grid */
        <div className="journal-grid">
          {/* 1. Net P&L Card */}
          <div className={`journal-card journal-card--pnl ${isNetProfit ? 'profit' : 'loss'}`}>
            <div className="card-header">
              <span className="card-title">{t('analytics.netPnl')}</span>
              <span className="material-symbols-outlined card-icon">payments</span>
            </div>
            <div className={`pnl-value ${isNetProfit ? 'profit' : 'loss'}`} style={{ direction: 'ltr', display: 'inline-block' }}>
              {formatCurrency(stats.netPnl, 2, true)}
            </div>
            <div className={`pnl-toman ${isNetProfit ? 'profit' : 'loss'}`}>
              {language === 'fa' 
                ? formatToman(stats.netPnl, usdToToman) 
                : (stats.netPnl * usdToToman).toLocaleString('en-US') + ' Toman'}
            </div>
            <div className="pnl-subtext-grid">
              <div className="sub-item">
                <span className="sub-label">{t('analytics.grossPnl')}</span>
                <span className="sub-val" style={{ color: stats.grossPnl >= 0 ? '#61f9b1' : '#ffb4ab', direction: 'ltr', display: 'inline-block' }}>
                  {formatCurrency(stats.grossPnl, 2)}
                </span>
              </div>
              <div className="sub-item">
                <span className="sub-label">{t('analytics.commissionAndSwap')}</span>
                <span className="sub-val" style={{ color: '#ffb4ab', direction: 'ltr', display: 'inline-block' }}>
                  {formatCurrency(stats.commissions + stats.swaps, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Win Rate Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">{t('analytics.winRate')}</span>
              <span className="material-symbols-outlined card-icon">emoji_events</span>
            </div>
            <div className="win-rate-container">
              {/* Radial gauge */}
              <div className="radial-progress-wrapper">
                <svg width="90" height="90">
                  <circle className="circle-bg" cx="45" cy="45" r="40" />
                  <circle
                    className="circle-bar"
                    cx="45"
                    cy="45"
                    r="40"
                    strokeDashoffset={radialDashOffset}
                  />
                </svg>
                <div className="radial-label-val">
                  {language === 'fa' ? '%' + toPersianDigits(Math.round(stats.winRateOverall).toString()) : Math.round(stats.winRateOverall) + '%'}
                </div>
              </div>

              {/* BUY/SELL breakdown */}
              <div className="direction-progress-group">
                <div className="progress-item">
                  <div className="progress-label-row">
                    <span className="lbl">{t('analytics.buy')}</span>
                    <span className="val">{language === 'fa' ? '%' + toPersianDigits(Math.round(stats.winRateBuy).toString()) : Math.round(stats.winRateBuy) + '%'}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar bar-buy" style={{ width: `${stats.winRateBuy}%` }} />
                  </div>
                </div>
                <div className="progress-item">
                  <div className="progress-label-row">
                    <span className="lbl">{t('analytics.sell')}</span>
                    <span className="val">{language === 'fa' ? '%' + toPersianDigits(Math.round(stats.winRateSell).toString()) : Math.round(stats.winRateSell) + '%'}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar bar-sell" style={{ width: `${stats.winRateSell}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Profit Factor & Expectancy Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">{t('analytics.profitabilityAndExpectancy')}</span>
              <span className="material-symbols-outlined card-icon">insights</span>
            </div>
            <div className="gauge-metric-row">
              <div className="gauge-box">
                <span className="gauge-label">{t('analytics.profitFactor')}</span>
                <span className={`gauge-val ${stats.profitFactor >= 1 ? 'positive' : 'negative'}`}>
                  {stats.profitFactor === Infinity ? '∞' : formatNum(stats.profitFactor.toFixed(2))}
                </span>
                <span className="gauge-indicator-text">{t('analytics.profitFactorDesc')}</span>
              </div>
              <div className="gauge-box">
                <span className="gauge-label">{t('analytics.expectancy')}</span>
                <span className={`gauge-val ${stats.expectancyUsd >= 0 ? 'positive' : 'negative'}`} style={{ direction: 'ltr', display: 'inline-block' }}>
                  {formatCurrency(stats.expectancyUsd, 2)}
                </span>
                <span className="gauge-indicator-text">{t('analytics.expectancyDesc')}</span>
              </div>
            </div>
          </div>

          {/* 4. R-Multiple Comparative Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">{t('analytics.riskRewardRatio')}</span>
              <span className="material-symbols-outlined card-icon">legend_toggle</span>
            </div>
            <div className="r-compare-container">
              {/* Planned R */}
              <div className="r-row">
                <div className="r-label-row">
                  <span className="lbl">{t('analytics.rPlanned')}</span>
                  <span className="val">R {formatNum(stats.avgRPlanned.toFixed(2))}</span>
                </div>
                <div className="compare-bar-track">
                  <div 
                    className="compare-bar-fill bar-planned" 
                    style={{ width: `${Math.min((stats.avgRPlanned / 4) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Achieved R */}
              <div className="r-row">
                <div className="r-label-row">
                  <span className="lbl">{t('analytics.rAchieved')}</span>
                  <span className="val">R {formatNum(stats.avgRAchieved.toFixed(2))}</span>
                </div>
                <div className="compare-bar-track">
                  <div 
                    className={`compare-bar-fill bar-achieved ${stats.avgRAchieved < stats.avgRPlanned ? 'underperforming' : ''} ${stats.avgRAchieved < 0 ? 'negative' : ''}`} 
                    style={{ width: `${Math.max(0, Math.min((stats.avgRAchieved / 4) * 100, 100))}%` }} 
                  />
                </div>
              </div>

              <div className="r-footer-ratio">
                {stats.avgRAchieved < stats.avgRPlanned 
                  ? t('analytics.rCompliancePoor') 
                  : t('analytics.rComplianceGood')}
              </div>
            </div>
          </div>

          {/* 5. Drawdown & Streak Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">{t('analytics.drawdownAndStreaks')}</span>
              <span className="material-symbols-outlined card-icon">warning</span>
            </div>
            <div className="drawdown-subgrid">
              <div className="sub-card">
                <span className="sub-lbl">{t('analytics.maxDrawdown')}</span>
                <span className="sub-val warning" style={{ direction: 'ltr', display: 'inline-block' }}>
                  {formatCurrency(stats.maxDrawdown, 2)}
                </span>
                <span className="sub-info">{t('analytics.maxDrawdownDesc')}</span>
              </div>
              <div className="sub-card">
                <span className="sub-lbl">{t('analytics.consecutiveLosses')}</span>
                <span className="sub-val" style={{ color: stats.maxConsecutiveLosses > 4 ? '#ffb4ab' : '#f8fafc' }}>
                  {formatNum(stats.maxConsecutiveLosses.toString())} {t('trades.tradeUnit')}
                </span>
                <span className="sub-info">{t('analytics.consecutiveLossesDesc')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'patterns' ? (
        /* Patterns (Tier 2) Panels */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Row A: Heatmap Hour Grid */}
          <div className="journal-card hour-heatmap-container">
            <div className="card-header">
              <span className="card-title">{t('analytics.timeDistribution')}</span>
              <span className="material-symbols-outlined card-icon">schedule</span>
            </div>
            <div className="hour-grid">
              {stats.hours.map((h) => {
                const hourFormatted = language === 'fa'
                  ? `${h.hour.toString().padStart(2, '0')}:۰۰`
                  : `${h.hour.toString().padStart(2, '0')}:00`;
                const hasPnl = h.count > 0;
                return (
                  <div key={h.hour} className={`hour-block ${h.className}`} title={language === 'fa' ? `تعداد معاملات: ${h.count}` : `Trades: ${h.count}`}>
                    <span className="hour-num">{formatNum(hourFormatted)}</span>
                    <span className={`hour-pnl ${h.pnl >= 0 ? 'positive' : 'negative'}`} style={{ direction: 'ltr', display: 'inline-block' }}>
                      {hasPnl 
                        ? formatCurrency(h.pnl, 0, true)
                        : formatNum('0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row A.2: Heatmap Timeframe Grid */}
          <div className="journal-card timeframe-heatmap-container">
            <div className="card-header">
              <span className="card-title">{t('analytics.timeframeDistribution')}</span>
              <span className="material-symbols-outlined card-icon">grid_on</span>
            </div>
            <div className="journal-table-wrapper" style={{ overflowX: 'auto', marginTop: '12px' }}>
              <table className="timeframe-heatmap-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Vazirmatn' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', fontSize: '12px', color: '#8898aa', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: language === 'fa' ? 'right' : 'left' }}>
                      {language === 'fa' ? 'تحلیل \\ ورود' : 'Analysis \\ Entry'}
                    </th>
                    {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'].map(tf => (
                      <th key={tf} style={{ padding: '8px', fontSize: '12px', color: '#8898aa', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', minWidth: '60px' }}>
                        {tf}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'].map(aTf => (
                    <tr key={aTf}>
                      <td style={{ padding: '8px', fontSize: '13px', fontWeight: 'bold', color: '#8898aa', borderBottom: '1px solid rgba(255,255,255,0.02)', textAlign: language === 'fa' ? 'right' : 'left' }}>
                        {aTf}
                      </td>
                      {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'].map(eTf => {
                        const cell = stats.timeframeMatrix?.[aTf]?.[eTf] || { wins: 0, total: 0, pnl: 0 };
                        const hasFewerThan10 = cell.total < 10;
                        const winRate = cell.total > 0 ? Math.round((cell.wins / cell.total) * 100) : 0;
                        const pnlVal = Math.round(cell.pnl);

                        // Color scaling
                        let bgColor = 'rgba(255, 255, 255, 0.02)';
                        let textColor = 'rgba(255, 255, 255, 0.3)';
                        if (!hasFewerThan10 && cell.total > 0) {
                          if (winRate >= 50) {
                            const opacity = Math.min(0.05 + ((winRate - 50) / 50) * 0.4, 0.45);
                            bgColor = `rgba(97, 249, 177, ${opacity})`;
                            textColor = '#61f9b1';
                          } else {
                            const opacity = Math.min(0.05 + ((50 - winRate) / 50) * 0.4, 0.45);
                            bgColor = `rgba(255, 180, 171, ${opacity})`;
                            textColor = '#ffb4ab';
                          }
                        }

                        return (
                          <td
                            key={eTf}
                            style={{
                              padding: '8px',
                              textAlign: 'center',
                              borderBottom: '1px solid rgba(255,255,255,0.02)',
                              backgroundColor: bgColor,
                              color: textColor,
                              fontSize: '12px',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                            title={
                              hasFewerThan10
                                ? (language === 'fa' 
                                    ? `داده ناکافی (${cell.total} معامله). برای نمایش الگو حداقل ۱۰ معامله نیاز است.` 
                                    : `Insufficient data (${cell.total} trades). At least 10 trades are needed to determine patterns.`)
                                : (language === 'fa' 
                                    ? `تعداد: ${cell.total} | سود/زیان: $${pnlVal}` 
                                    : `Count: ${cell.total} | P&L: $${pnlVal}`)
                            }
                          >
                            {hasFewerThan10 ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', color: 'rgba(255,255,255,0.12)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>lock</span>
                                <span>-</span>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{language === 'fa' ? '%' + toPersianDigits(winRate.toString()) : winRate + '%'}</div>
                                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                                  {language === 'fa' ? `(${toPersianDigits(cell.total)} معامله)` : `(${cell.total} trades)`}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 12px', background: 'rgba(255, 180, 171, 0.04)', borderRadius: '6px', border: '1px solid rgba(255, 180, 171, 0.12)' }}>
              <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: '18px' }}>warning</span>
              <span style={{ fontSize: '11px', color: '#bbcabe', fontFamily: 'Vazirmatn' }}>
                {language === 'fa'
                  ? 'تایم‌فریم‌هایی که تعداد معاملات آن‌ها کمتر از ۱۰ مورد است، جهت جلوگیری از سوگیری‌های آماری غیردقیق و نادرست قفل شده و نمایش داده نمی‌شوند.'
                  : 'Timeframes with fewer than 10 trades are locked and hidden to prevent inaccurate statistical biases.'}
              </span>
            </div>
          </div>

          {/* Row B: Sessions & Emotions */}
          <div className="patterns-split-row">
            {/* Session Card */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">{language === 'fa' ? 'عملکرد بر اساس جلسات معاملاتی (Sessions)' : 'Performance by Trading Session'}</span>
                <span className="material-symbols-outlined card-icon">public</span>
              </div>
              <div className="stats-list">
                {stats.sessions.map((sess) => (
                  <div key={sess.name} className="stats-list-item">
                    <div className="item-meta">
                      <span className="item-emoji">{sess.emoji}</span>
                      <span className="item-label">{getSessionLabel(sess.label)}</span>
                      <span className="item-count">
                        {language === 'fa' ? `(${toPersianDigits(sess.total)} معامله)` : `(${sess.total} trades)`}
                      </span>
                    </div>
                    <div className="item-stats">
                      <span className={`item-winrate ${sess.winRate >= 50 ? '' : 'losing'}`}>
                        {language === 'fa'
                          ? `%${toPersianDigits(Math.round(sess.winRate).toString())} برد`
                          : `${Math.round(sess.winRate)}% Win`}
                      </span>
                      <span className={`item-pnl ${sess.pnl >= 0 ? 'positive' : 'negative'}`} style={{ direction: 'ltr' }}>
                        {formatCurrency(sess.pnl, 0, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Impact Card */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">{language === 'fa' ? 'تأثیر هیجانات بر نتیجه معامله (Emotions)' : 'Impact of Emotions on Trading'}</span>
                <span className="material-symbols-outlined card-icon">psychology</span>
              </div>
              <div className="stats-list">
                {stats.emotions.map((emo) => (
                  <div key={emo.name} className="stats-list-item">
                    <div className="item-meta">
                      <span className="item-emoji">{emo.emoji}</span>
                      <span className="item-label">{emo.label}</span>
                      <span className="item-count">
                        {language === 'fa' ? `(${toPersianDigits(emo.total)} معامله)` : `(${emo.total} trades)`}
                      </span>
                    </div>
                    <div className="item-stats">
                      <span className={`item-winrate ${emo.winRate >= 50 ? '' : 'losing'}`}>
                        {language === 'fa'
                          ? `%${toPersianDigits(Math.round(emo.winRate).toString())} برد`
                          : `${Math.round(emo.winRate)}% Win`}
                      </span>
                      <span className={`item-pnl ${emo.pnl >= 0 ? 'positive' : 'negative'}`} style={{ direction: 'ltr' }}>
                        {formatCurrency(emo.pnl, 0, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row C: Symbol Table & Strategies */}
          <div className="patterns-split-row">
            {/* Symbol Table */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">{language === 'fa' ? 'سودده‌ترین نمادها (Main Symbols)' : 'Most Profitable Symbols'}</span>
                <span className="material-symbols-outlined card-icon">toll</span>
              </div>
              <div className="journal-table-wrapper">
                <table className="journal-data-table">
                  <thead>
                    <tr>
                      <th>{language === 'fa' ? 'نماد' : 'Symbol'}</th>
                      <th>{language === 'fa' ? 'تعداد معامله' : 'Trades'}</th>
                      <th>{language === 'fa' ? 'نسبت برد' : 'Win Rate'}</th>
                      <th>{language === 'fa' ? 'خالص سود و زیان' : 'Net P&L'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.symbols.map((sym) => (
                      <tr key={sym.symbol}>
                        <td style={{ fontWeight: '700' }}>{sym.symbol}</td>
                        <td>{formatNum(sym.total)}</td>
                        <td style={{ color: sym.winRate >= 50 ? '#61f9b1' : '#ffb4ab', fontWeight: '600' }}>
                          {language === 'fa' ? '%' + toPersianDigits(Math.round(sym.winRate).toString()) : Math.round(sym.winRate) + '%'}
                        </td>
                        <td style={{ color: sym.pnl >= 0 ? '#61f9b1' : '#ffb4ab', fontWeight: '700', direction: 'ltr' }}>
                          {formatCurrency(sym.pnl, 2, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategy Tags & Weekday */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Strategies Card */}
              <div className="journal-card" style={{ flex: 1 }}>
                <div className="card-header">
                  <span className="card-title">{language === 'fa' ? 'عملکرد بر اساس استراتژی (Strategy tags)' : 'Performance by Strategy'}</span>
                  <span className="material-symbols-outlined card-icon">label</span>
                </div>
                <div className="stats-list">
                  {stats.strategies.length === 0 ? (
                    <span style={{ fontSize: '13px', color: '#bbcabe', textAlign: 'center', padding: '16px' }}>
                      {language === 'fa' ? 'استراتژی یا برچسبی یافت نشد.' : 'No strategy tags found.'}
                    </span>
                  ) : (
                    stats.strategies.slice(0, 4).map((strat) => (
                      <div key={strat.tag} className="stats-list-item">
                        <div className="item-meta">
                          <span className="item-label">#{strat.tag}</span>
                          <span className="item-count">
                            {language === 'fa' ? `(${toPersianDigits(strat.total)} معامله)` : `(${strat.total} trades)`}
                          </span>
                        </div>
                        <div className="item-stats">
                          <span className={`item-winrate ${strat.winRate >= 50 ? '' : 'losing'}`}>
                            {language === 'fa'
                              ? `%${toPersianDigits(Math.round(strat.winRate).toString())} برد`
                              : `${Math.round(strat.winRate)}% Win`}
                          </span>
                          <span className={`item-pnl ${strat.pnl >= 0 ? 'positive' : 'negative'}`} style={{ direction: 'ltr' }}>
                            {formatCurrency(strat.pnl, 0, true)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Day of week Card */}
              <div className="journal-card" style={{ flex: 1 }}>
                <div className="card-header">
                  <span className="card-title">{language === 'fa' ? 'عملکرد بر اساس روزهای هفته' : 'Performance by Weekday'}</span>
                  <span className="material-symbols-outlined card-icon">calendar_today</span>
                </div>
                <div className="stats-list">
                  {stats.weekdays.map((day) => (
                    <div key={day.dayIndex} className="stats-list-item">
                      <div className="item-meta">
                        <span className="item-label">{day.name}</span>
                        <span className="item-count">
                          {language === 'fa' ? `(${toPersianDigits(day.total)} معامله)` : `(${day.total} trades)`}
                        </span>
                      </div>
                      <div className="item-stats">
                        <span className={`item-winrate ${day.winRate >= 50 ? '' : 'losing'}`}>
                          {language === 'fa'
                            ? `%${toPersianDigits(Math.round(day.winRate).toString())} برد`
                            : `${Math.round(day.winRate)}% Win`}
                        </span>
                        <span className={`item-pnl ${day.pnl >= 0 ? 'positive' : 'negative'}`} style={{ direction: 'ltr' }}>
                          {formatCurrency(day.pnl, 0, true)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Charts & Risk (Tier 3) Panels */
        <div className="charts-tab-container">
          
          {/* 1. Equity Curve Card */}
          <div className="journal-card journal-card--full-width">
            <div className="card-header">
              <span className="card-title">{language === 'fa' ? 'نمودار رشد سرمایه (Cumulative Equity Curve)' : 'Cumulative Equity Growth Curve'}</span>
              <span className="material-symbols-outlined card-icon">show_chart</span>
            </div>
            
            <div className="chart-wrapper">
              {sortedClosedTrades.length > 0 ? (
                <EquityChart closedTrades={sortedClosedTrades} />
              ) : (
                <div style={{ color: '#bbcabe', fontSize: '13px' }}>
                  {language === 'fa' ? 'اطلاعات کافی برای ترسیم وجود ندارد.' : 'Not enough data to draw chart.'}
                </div>
              )}
            </div>
          </div>

          <div className="patterns-split-row">
            {/* 2. Weekday P&L Bar Chart */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">{language === 'fa' ? 'سود و زیان به تفکیک روزهای هفته' : 'Profit & Loss by Weekday'}</span>
                <span className="material-symbols-outlined card-icon">bar_chart</span>
              </div>
              <div className="chart-wrapper">
                <WeekdayPnlChart closedTrades={sortedClosedTrades} />
              </div>
            </div>

            {/* 3. Monthly Calendar Heatmap */}
            <TradingCalendar closedTrades={sortedClosedTrades} />
          </div>

          <div className="patterns-split-row">
            {/* 4. R-Multiple Distribution Histogram */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">{language === 'fa' ? 'توزیع ریوارد کسب‌شده (R-Multiple Distribution)' : 'R-Multiple Distribution'}</span>
                <span className="material-symbols-outlined card-icon">query_stats</span>
              </div>
              <div className="histogram-container">
                {rDistribution.map((bin) => (
                  <div key={bin.key} className="histogram-row">
                    <div className="row-meta">
                      <span className="bin-label">{bin.label}</span>
                      <span className="bin-stats">
                        {formatNum(bin.count)} {t('trades.tradeUnit')}
                        <span className="percent">
                          {language === 'fa' ? `(${toPersianDigits(Math.round(bin.percentage))}٪)` : `(${Math.round(bin.percentage)}%)`}
                        </span>
                      </span>
                    </div>
                    <div className="row-track">
                      <div 
                        className={`row-fill ${bin.className}`} 
                        style={{ width: `${bin.relativeWidth}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Avg Winner vs Avg Loser Comparisons */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">{language === 'fa' ? 'مقایسه معاملات برنده و بازنده (Risk Metrics)' : 'Risk Metrics (Winners vs Losers)'}</span>
                <span className="material-symbols-outlined card-icon">balance</span>
              </div>
              <div className="comparisons-container">
                
                {/* Dollar Winner vs Loser */}
                <div className="comparison-block">
                  <div className="comparison-title">{language === 'fa' ? 'میانگین سود در برابر میانگین زیان (دلار)' : 'Average Profit vs Average Loss (USD)'}</div>
                  <div className="comparison-values-row">
                    <div className="comp-item winner">
                      <span className="lbl">{language === 'fa' ? 'میانگین برد' : 'Avg Win'}</span>
                      <span className="val" style={{ direction: 'ltr', display: 'inline-block' }}>
                        {formatCurrency(comparisons.avgWinnerUsd, 2, true)}
                      </span>
                    </div>
                    <div className="comp-item loser">
                      <span className="lbl">{language === 'fa' ? 'میانگین باخت' : 'Avg Loss'}</span>
                      <span className="val" style={{ direction: 'ltr', display: 'inline-block' }}>
                        {formatCurrency(-comparisons.avgLoserUsd, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="comparison-visual-track">
                    <div 
                      className="bar-winner-fill" 
                      style={{ 
                        width: `${(comparisons.avgWinnerUsd / ((comparisons.avgWinnerUsd + comparisons.avgLoserUsd) || 1)) * 100}%` 
                      }} 
                    />
                    <div 
                      className="bar-loser-fill" 
                      style={{ 
                        width: `${(comparisons.avgLoserUsd / ((comparisons.avgWinnerUsd + comparisons.avgLoserUsd) || 1)) * 100}%` 
                      }} 
                    />
                  </div>
                </div>

                {/* Pips Winner vs Loser */}
                <div className="comparison-block">
                  <div className="comparison-title">{language === 'fa' ? 'میانگین سود در برابر میانگین زیان (پیپ)' : 'Average Profit vs Average Loss (Pips)'}</div>
                  <div className="comparison-values-row">
                    <div className="comp-item winner">
                      <span className="lbl">{language === 'fa' ? 'میانگین برد پیپ' : 'Avg Win Pips'}</span>
                      <span className="val" style={{ direction: 'ltr', display: 'inline-block' }}>
                        +{formatNum(comparisons.avgWinnerPips.toFixed(1))} pip
                      </span>
                    </div>
                    <div className="comp-item loser">
                      <span className="lbl">{language === 'fa' ? 'میانگین باخت پیپ' : 'Avg Loss Pips'}</span>
                      <span className="val" style={{ direction: 'ltr', display: 'inline-block' }}>
                        -{formatNum(comparisons.avgLoserPips.toFixed(1))} pip
                      </span>
                    </div>
                  </div>
                  <div className="comparison-visual-track">
                    <div 
                      className="bar-winner-fill" 
                      style={{ 
                        width: `${(comparisons.avgWinnerPips / ((comparisons.avgWinnerPips + comparisons.avgLoserPips) || 1)) * 100}%` 
                      }} 
                    />
                    <div 
                      className="bar-loser-fill" 
                      style={{ 
                        width: `${(comparisons.avgLoserPips / ((comparisons.avgWinnerPips + comparisons.avgLoserPips) || 1)) * 100}%` 
                      }} 
                    />
                  </div>
                </div>

                {/* Risk reward ratio */}
                <div className="ratio-card-footer">
                  <span className="footer-label">{language === 'fa' ? 'نسبت ریسک به ریوارد واقعی (W/L Ratio)' : 'Actual Risk-to-Reward Ratio (W/L Ratio)'}</span>
                  <span className="footer-value">
                    {formatNum(comparisons.winLossRatio.toFixed(2))}
                  </span>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
