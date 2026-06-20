'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import Select from '../../components/ui/Select';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../../utils/farsi';
import { getTradingSession, getMainPair, getEmotionEmoji } from '../../utils/tradeHelpers';
import '../../components/journal/journal.scss';

// Emotions helper mapping
const EMOTION_MAP: { [key: string]: { label: string; emoji: string } } = {
  CONFIDENT: { label: 'با اطمینان', emoji: '😌' },
  NEUTRAL: { label: 'خنثی', emoji: '😐' },
  ANXIOUS: { label: 'مضطرب', emoji: '😰' },
  FOMO: { label: 'فومو (عجول)', emoji: '🎯' },
  REVENGE: { label: 'انتقامی', emoji: '😡' },
  UNKNOWN: { label: 'نامشخص', emoji: '💭' },
};

// Weekday index mapping to Persian names
const WEEKDAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns'>('overview');

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

  // Load trades and accounts if empty
  useEffect(() => {
    fetchTrades(false, selectedAccountId);
  }, [selectedAccountId]);

  // Compute Statistics (Tier 1 & Tier 2)
  const stats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.closeTime !== null && t.closePrice !== null);
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
        name: WEEKDAY_NAMES[idx],
        ...weekdaysGroup[idx],
        winRate: (weekdaysGroup[idx].wins / weekdaysGroup[idx].total) * 100,
      };
    }).sort((a, b) => a.dayIndex - b.dayIndex);

    // Format Emotion lists
    const emotionsList = Object.keys(emotionsGroup).map((key) => ({
      name: key,
      label: EMOTION_MAP[key]?.label || key,
      emoji: EMOTION_MAP[key]?.emoji || '💭',
      ...emotionsGroup[key],
      winRate: (emotionsGroup[key].wins / emotionsGroup[key].total) * 100,
      avgPnl: emotionsGroup[key].pnl / emotionsGroup[key].total,
    })).sort((a, b) => b.pnl - a.pnl);

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
    };
  }, [trades]);

  // Account selector dropdown list options
  const accountOptions = useMemo(() => {
    const list = accounts.map((acc) => ({
      value: acc.id,
      label: acc.name + (acc.accountNumber ? ` (${acc.accountNumber})` : ''),
    }));
    return [{ value: 'all', label: 'همه حساب‌ها' }, ...list];
  }, [accounts]);

  // Helper formatting values
  const isNetProfit = stats.netPnl >= 0;
  const radialDashOffset = 251.2 - (251.2 * stats.winRateOverall) / 100;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111319', color: '#61f9b1' }}>
        <div style={{ fontSize: '20px', fontFamily: 'Vazirmatn' }}>در حال بارگذاری تحلیل ژورنال...</div>
      </div>
    );
  }

  return (
    <div className="journal-container">
      {/* Header */}
      <header className="journal-header">
        <h1>تحلیل ژورنال معاملاتی</h1>
        <div className="header-actions">
          <Select
            options={accountOptions}
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            placeholder="انتخاب حساب"
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="journal-tabs">
        <button
          className={`journal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          خلاصه عملکرد (Overview)
        </button>
        <button
          className={`journal-tab-btn ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          شناسایی الگوها (Patterns)
        </button>
      </div>

      {stats.totalCount === 0 ? (
        <div className="journal-empty-state">
          <span className="material-symbols-outlined empty-icon">analytics</span>
          <h3>داده‌ای یافت نشد</h3>
          <p>هیچ معامله بسته‌شده‌ای در این حساب ثبت نشده است. برای مشاهده آمار، معاملات خود را ثبت یا فایل معاملاتی وارد کنید.</p>
        </div>
      ) : activeTab === 'overview' ? (
        /* Overview (Tier 1) Grid */
        <div className="journal-grid">
          {/* 1. Net P&L Card */}
          <div className={`journal-card journal-card--pnl ${isNetProfit ? 'profit' : 'loss'}`}>
            <div className="card-header">
              <span className="card-title">کل سود و زیان (P&L Net)</span>
              <span className="material-symbols-outlined card-icon">payments</span>
            </div>
            <div className={`pnl-value ${isNetProfit ? 'profit' : 'loss'}`}>
              {isNetProfit ? '+' : ''}${toPersianDigits(stats.netPnl.toFixed(2))}
            </div>
            <div className={`pnl-toman ${isNetProfit ? 'profit' : 'loss'}`}>
              {formatToman(stats.netPnl, usdToToman)}
            </div>
            <div className="pnl-subtext-grid">
              <div className="sub-item">
                <span className="sub-label">ناخالص P&L</span>
                <span className="sub-val" style={{ color: stats.grossPnl >= 0 ? '#61f9b1' : '#ffb4ab' }}>
                  ${toPersianDigits(stats.grossPnl.toFixed(2))}
                </span>
              </div>
              <div className="sub-item">
                <span className="sub-label">کمیسیون و سواپ</span>
                <span className="sub-val" style={{ color: '#ffb4ab' }}>
                  ${toPersianDigits((stats.commissions + stats.swaps).toFixed(2))}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Win Rate Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">نسبت برد (Win Rate)</span>
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
                  %{toPersianDigits(Math.round(stats.winRateOverall).toString())}
                </div>
              </div>

              {/* BUY/SELL breakdown */}
              <div className="direction-progress-group">
                <div className="progress-item">
                  <div className="progress-label-row">
                    <span className="lbl">خرید (BUY)</span>
                    <span className="val">%{toPersianDigits(Math.round(stats.winRateBuy).toString())}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar bar-buy" style={{ width: `${stats.winRateBuy}%` }} />
                  </div>
                </div>
                <div className="progress-item">
                  <div className="progress-label-row">
                    <span className="lbl">فروش (SELL)</span>
                    <span className="val">%{toPersianDigits(Math.round(stats.winRateSell).toString())}</span>
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
              <span className="card-title">سودآوری و امید ریاضی</span>
              <span className="material-symbols-outlined card-icon">insights</span>
            </div>
            <div className="gauge-metric-row">
              <div className="gauge-box">
                <span className="gauge-label">فاکتور سود</span>
                <span className={`gauge-val ${stats.profitFactor >= 1 ? 'positive' : 'negative'}`}>
                  {stats.profitFactor === Infinity ? '∞' : toPersianDigits(stats.profitFactor.toFixed(2))}
                </span>
                <span className="gauge-indicator-text">حاصل‌تقسیم سود بر ضرر</span>
              </div>
              <div className="gauge-box">
                <span className="gauge-label">امید ریاضی (Expectancy)</span>
                <span className={`gauge-val ${stats.expectancyUsd >= 0 ? 'positive' : 'negative'}`}>
                  ${toPersianDigits(stats.expectancyUsd.toFixed(2))}
                </span>
                <span className="gauge-indicator-text">میانگین بازده هر معامله</span>
              </div>
            </div>
          </div>

          {/* 4. R-Multiple Comparative Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">ضریب ریسک به ریوارد (R)</span>
              <span className="material-symbols-outlined card-icon">legend_toggle</span>
            </div>
            <div className="r-compare-container">
              {/* Planned R */}
              <div className="r-row">
                <div className="r-label-row">
                  <span className="lbl">میانگین ریوارد هدف (R Planned)</span>
                  <span className="val">R {toPersianDigits(stats.avgRPlanned.toFixed(2))}</span>
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
                  <span className="lbl">میانگین ریوارد کسب‌شده (R Achieved)</span>
                  <span className="val">R {toPersianDigits(stats.avgRAchieved.toFixed(2))}</span>
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
                  ? 'کسب سود کمتر از برنامه معاملاتی (خروج زودهنگام)' 
                  : 'پایبندی عالی به برنامه کسب سود هدف'}
              </div>
            </div>
          </div>

          {/* 5. Drawdown & Streak Card */}
          <div className="journal-card">
            <div className="card-header">
              <span className="card-title">افت سرمایه و ضررهای متوالی</span>
              <span className="material-symbols-outlined card-icon">warning</span>
            </div>
            <div className="drawdown-subgrid">
              <div className="sub-card">
                <span className="sub-lbl">حداکثر افت سرمایه (MDD)</span>
                <span className="sub-val warning">
                  ${toPersianDigits(stats.maxDrawdown.toFixed(2))}
                </span>
                <span className="sub-info">بیشترین سقوط از قله حساب</span>
              </div>
              <div className="sub-card">
                <span className="sub-lbl">ضرر متوالی (Streak)</span>
                <span className="sub-val" style={{ color: stats.maxConsecutiveLosses > 4 ? '#ffb4ab' : '#f8fafc' }}>
                  {toPersianDigits(stats.maxConsecutiveLosses.toString())} معامله
                </span>
                <span className="sub-info">طولانی‌ترین زنجیره باخت‌ها</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Patterns (Tier 2) Panels */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Row A: Heatmap Hour Grid */}
          <div className="journal-card hour-heatmap-container">
            <div className="card-header">
              <span className="card-title">توزیع زمانی سود و زیان (ساعت‌های شبانه‌روز به وقت تهران)</span>
              <span className="material-symbols-outlined card-icon">schedule</span>
            </div>
            <div className="hour-grid">
              {stats.hours.map((h) => {
                const hourFormatted = `${h.hour.toString().padStart(2, '0')}:۰۰`;
                const hasPnl = h.count > 0;
                return (
                  <div key={h.hour} className={`hour-block ${h.className}`} title={`تعداد معاملات: ${h.count}`}>
                    <span className="hour-num">{toPersianDigits(hourFormatted)}</span>
                    <span className={`hour-pnl ${h.pnl >= 0 ? 'positive' : 'negative'}`}>
                      {hasPnl 
                        ? `${h.pnl >= 0 ? '+' : ''}$${toPersianDigits(Math.round(h.pnl).toString())}`
                        : toPersianDigits('۰')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row B: Sessions & Emotions */}
          <div className="patterns-split-row">
            {/* Session Card */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">عملکرد بر اساس جلسات معاملاتی (Sessions)</span>
                <span className="material-symbols-outlined card-icon">public</span>
              </div>
              <div className="stats-list">
                {stats.sessions.map((sess) => (
                  <div key={sess.name} className="stats-list-item">
                    <div className="item-meta">
                      <span className="item-emoji">{sess.emoji}</span>
                      <span className="item-label">{sess.label}</span>
                      <span className="item-count">({toPersianDigits(sess.total)} معامله)</span>
                    </div>
                    <div className="item-stats">
                      <span className={`item-winrate ${sess.winRate >= 50 ? '' : 'losing'}`}>
                        %{toPersianDigits(Math.round(sess.winRate).toString())} برد
                      </span>
                      <span className={`item-pnl ${sess.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {sess.pnl >= 0 ? '+' : ''}${toPersianDigits(sess.pnl.toFixed(0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotion Impact Card */}
            <div className="journal-card">
              <div className="card-header">
                <span className="card-title">تأثیر هیجانات بر نتیجه معامله (Emotions)</span>
                <span className="material-symbols-outlined card-icon">psychology</span>
              </div>
              <div className="stats-list">
                {stats.emotions.map((emo) => (
                  <div key={emo.name} className="stats-list-item">
                    <div className="item-meta">
                      <span className="item-emoji">{emo.emoji}</span>
                      <span className="item-label">{emo.label}</span>
                      <span className="item-count">({toPersianDigits(emo.total)} معامله)</span>
                    </div>
                    <div className="item-stats">
                      <span className={`item-winrate ${emo.winRate >= 50 ? '' : 'losing'}`}>
                        %{toPersianDigits(Math.round(emo.winRate).toString())} برد
                      </span>
                      <span className={`item-pnl ${emo.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {emo.pnl >= 0 ? '+' : ''}${toPersianDigits(emo.pnl.toFixed(0))}
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
                <span className="card-title">سودده‌ترین نمادها (Main Symbols)</span>
                <span className="material-symbols-outlined card-icon">toll</span>
              </div>
              <div className="journal-table-wrapper">
                <table className="journal-data-table">
                  <thead>
                    <tr>
                      <th>نماد</th>
                      <th>تعداد معامله</th>
                      <th>نسبت برد</th>
                      <th>خالص سود و زیان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.symbols.map((sym) => (
                      <tr key={sym.symbol}>
                        <td style={{ fontWeight: '700' }}>{sym.symbol}</td>
                        <td>{toPersianDigits(sym.total)}</td>
                        <td style={{ color: sym.winRate >= 50 ? '#61f9b1' : '#ffb4ab', fontWeight: '600' }}>
                          %{toPersianDigits(Math.round(sym.winRate).toString())}
                        </td>
                        <td style={{ color: sym.pnl >= 0 ? '#61f9b1' : '#ffb4ab', fontWeight: '700', direction: 'ltr' }}>
                          {sym.pnl >= 0 ? '+' : ''}${toPersianDigits(sym.pnl.toFixed(2))}
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
                  <span className="card-title">عملکرد بر اساس استراتژی (Strategy tags)</span>
                  <span className="material-symbols-outlined card-icon">label</span>
                </div>
                <div className="stats-list">
                  {stats.strategies.length === 0 ? (
                    <span style={{ fontSize: '13px', color: '#bbcabe', textAlign: 'center', padding: '16px' }}>
                      استراتژی یا برچسبی یافت نشد.
                    </span>
                  ) : (
                    stats.strategies.slice(0, 4).map((strat) => (
                      <div key={strat.tag} className="stats-list-item">
                        <div className="item-meta">
                          <span className="item-label">#{strat.tag}</span>
                          <span className="item-count">({toPersianDigits(strat.total)} معامله)</span>
                        </div>
                        <div className="item-stats">
                          <span className={`item-winrate ${strat.winRate >= 50 ? '' : 'losing'}`}>
                            %{toPersianDigits(Math.round(strat.winRate).toString())} برد
                          </span>
                          <span className={`item-pnl ${strat.pnl >= 0 ? 'positive' : 'negative'}`}>
                            {strat.pnl >= 0 ? '+' : ''}${toPersianDigits(strat.pnl.toFixed(0))}
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
                  <span className="card-title">عملکرد بر اساس روزهای هفته</span>
                  <span className="material-symbols-outlined card-icon">calendar_today</span>
                </div>
                <div className="stats-list">
                  {stats.weekdays.map((day) => (
                    <div key={day.dayIndex} className="stats-list-item">
                      <div className="item-meta">
                        <span className="item-label">{day.name}</span>
                        <span className="item-count">({toPersianDigits(day.total)} معامله)</span>
                      </div>
                      <div className="item-stats">
                        <span className={`item-winrate ${day.winRate >= 50 ? '' : 'losing'}`}>
                          %{toPersianDigits(Math.round(day.winRate).toString())} برد
                        </span>
                        <span className={`item-pnl ${day.pnl >= 0 ? 'positive' : 'negative'}`}>
                          {day.pnl >= 0 ? '+' : ''}${toPersianDigits(day.pnl.toFixed(0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
