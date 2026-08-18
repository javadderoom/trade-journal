'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Trade } from '../../types/trade';
import { useTranslation } from '../../store/useAppStore';
import { getEmotionEmoji, getEmotionLabel, formatCurrency, getNetPnl } from '../../utils/tradeHelpers';
import { toPersianDigits, formatToman } from '../../utils/farsi';
import './WorstEmotionAlert.scss';

interface WorstEmotionAlertProps {
  trades: Trade[];
  emotionsList?: { value: string; label: string; emoji?: string }[];
  usdToToman?: number;
  onFilterEmotion?: (emotion: string) => void;
}

interface EmotionStat {
  emotion: string;
  label: string;
  emoji: string;
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

export default function WorstEmotionAlert({
  trades,
  emotionsList,
  usdToToman = 90_000,
  onFilterEmotion,
}: WorstEmotionAlertProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [dismissedEmotion, setDismissedEmotion] = useState<string | null>(null);

  // 1. Compute worst-performing emotion
  const worstEmotion = useMemo<EmotionStat | null>(() => {
    if (!trades || trades.length === 0) return null;

    const groupMap: Record<
      string,
      { totalPnl: number; tradeCount: number; winCount: number; lossCount: number }
    > = {};

    for (const trade of trades) {
      // Only evaluate closed trades that have an emotion tag
      if (!trade.annotation?.emotion) continue;
      // If open trade (closeTime is null and closePrice is null), skip from historical calculation
      if (!trade.closeTime && trade.closePrice === null) continue;

      const emo = trade.annotation.emotion;
      const net = getNetPnl(trade);

      if (!groupMap[emo]) {
        groupMap[emo] = { totalPnl: 0, tradeCount: 0, winCount: 0, lossCount: 0 };
      }

      groupMap[emo].totalPnl += net;
      groupMap[emo].tradeCount += 1;
      if (net > 0) {
        groupMap[emo].winCount += 1;
      } else if (net < 0) {
        groupMap[emo].lossCount += 1;
      }
    }

    const negativeEmotions: EmotionStat[] = [];

    for (const [emo, stats] of Object.entries(groupMap)) {
      if (stats.totalPnl < 0 && stats.tradeCount > 0) {
        const label = getEmotionLabel(emo, emotionsList, language);
        const emoji = getEmotionEmoji(emo, emotionsList);
        const winRate = (stats.winCount / stats.tradeCount) * 100;

        negativeEmotions.push({
          emotion: emo,
          label,
          emoji,
          totalPnl: stats.totalPnl,
          tradeCount: stats.tradeCount,
          winCount: stats.winCount,
          lossCount: stats.lossCount,
          winRate,
        });
      }
    }

    if (negativeEmotions.length === 0) return null;

    // Sort by lowest (most negative) PnL
    negativeEmotions.sort((a, b) => a.totalPnl - b.totalPnl);
    return negativeEmotions[0];
  }, [trades, emotionsList, language]);

  // 2. Check session storage dismissal
  useEffect(() => {
    if (worstEmotion && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`worst_emotion_dismissed_${worstEmotion.emotion}`);
      if (stored === 'true') {
        setDismissedEmotion(worstEmotion.emotion);
      }
    }
  }, [worstEmotion]);

  const handleDismiss = () => {
    if (worstEmotion) {
      setDismissedEmotion(worstEmotion.emotion);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`worst_emotion_dismissed_${worstEmotion.emotion}`, 'true');
      }
    }
  };

  if (!worstEmotion) return null;
  if (dismissedEmotion === worstEmotion.emotion) return null;

  const currentEmotionLabel = getEmotionLabel(worstEmotion.emotion, emotionsList, language);

  // 3. Formulate specific psychological advice & messages
  const getCoachingContent = (stat: EmotionStat) => {
    const raw = stat.emotion.trim();
    let rawKey = raw.toUpperCase();
    if (raw === 'انتقامی') rawKey = 'REVENGE';
    else if (raw === 'فومو' || raw === 'فومو (عجول)') rawKey = 'FOMO';
    else if (raw === 'مضطرب') rawKey = 'ANXIOUS';
    else if (raw === 'با اطمینان' || raw === 'باطمینان') rawKey = 'CONFIDENT';
    else if (raw === 'خنثی') rawKey = 'NEUTRAL';

    switch (rawKey) {
      case 'REVENGE':
        return {
          title: isEn ? 'Revenge Trading Alert' : 'هشدار معاملات انتقامی (Revenge Trading)',
          advice: isEn
            ? 'When taking a loss, the desire to immediately win it back often leads to oversized positions and violated rules. Take a mandatory 15-minute cool-down break away from the screens after any losing trade.'
            : 'پس از هر ضرر، تمایل به جبران سریع منجر به افزایش غیرمنطقی حجم و نادیده گرفتن قوانین می‌شود. پس از هر معامله ناموفق، حداقل ۱۵ دقیقه از پای سیستم فاصله بگیرید.',
        };
      case 'FOMO':
        return {
          title: isEn ? 'FOMO Entry Warning' : 'هشدار معاملات عجولانه و فومو (FOMO)',
          advice: isEn
            ? 'Chasing running candles out of fear of missing the move severely damages risk-to-reward. Strictly wait for planned pullbacks and checklist confirmation before entering.'
            : 'ورودهای عجولانه از ترس جا ماندن از حرکت قیمت، نسبت ریسک به ریوارد را تخریب می‌کند. همیشه طبق چک‌لیست منتظر پولبک و تاییدیه بمانید.',
        };
      case 'ANXIOUS':
        return {
          title: isEn ? 'Anxiety & Hesitation Alert' : 'هشدار معامله در حالت اضطراب (Anxious)',
          advice: isEn
            ? 'Trading with elevated anxiety signals that your position size exceeds your psychological risk tolerance. Scale down your lot size by 30-50% until you can execute with complete neutrality.'
            : 'اضطراب بالا نشان‌دهنده حجم معامله فراتر از ظرفیت روانی شماست. حجم (Lot Size) را کاهش دهید تا تصمیمات منطقی جایگزین استرس شوند.',
        };
      case 'CONFIDENT':
        return {
          title: isEn ? 'Overconfidence Warning' : 'هشدار اطمینان بیش از حد (Overconfidence)',
          advice: isEn
            ? 'Excessive confidence can lead to complacency, widened stop-losses, and over-leveraging. Treat every single setup with equal discipline and risk protection.'
            : 'اطمینان بیش از حد به پیش‌بینی، گاهی منجر به سهل‌انگاری در حد ضرر و پذیرش ریسک‌های خارج از برنامه می‌شود. به هر معامله با احتیاط و انضباط کامل نگاه کنید.',
        };
      case 'NEUTRAL':
        return {
          title: isEn ? 'Execution Discipline Review' : 'بررسی استراتژی و اجرای معاملات',
          advice: isEn
            ? 'Trades marked with neutral emotion are currently generating net losses. Review your technical entry criteria and risk-reward parameters to ensure your edge is intact.'
            : 'معاملات با احساس خنثی نیز در حال حاضر بازدهی منفی داشته‌اند. قوانین ورود تکنیکال و نسبت سود به زیان این ستاپ‌ها را بازبینی کنید.',
        };
      default:
        return {
          title: isEn ? `Performance Alert: ${currentEmotionLabel}` : `هشدار عملکرد: ${currentEmotionLabel}`,
          advice: isEn
            ? `Trades tagged with "${currentEmotionLabel}" are your largest source of emotional drawdown. Review these trades in detail to identify and eliminate repeating errors.`
            : `معاملات با برچسب احساسی «${currentEmotionLabel}» بیشترین زیان را در سابقه شما ایجاد کرده‌اند. این معاملات را بررسی کنید تا خطاهای تکراری متوقف شوند.`,
        };
    }
  };

  const coaching = getCoachingContent(worstEmotion);
  const formattedLoss = formatCurrency(worstEmotion.totalPnl);
  const tomanLoss = !isEn && usdToToman ? formatToman(worstEmotion.totalPnl, usdToToman) : null;
  const formattedWinRate = isEn
    ? `${worstEmotion.winRate.toFixed(0)}%`
    : `${toPersianDigits(worstEmotion.winRate.toFixed(0))}٪`;
  const formattedCount = isEn
    ? `${worstEmotion.tradeCount} Trades`
    : `${toPersianDigits(worstEmotion.tradeCount)} معامله`;

  return (
    <div className={`worst-emotion-alert ${isEn ? 'ltr' : 'rtl'}`}>
      {/* Icon with pulsing indicator */}
      <div className="alert-icon-wrapper">
        <span className="material-symbols-outlined alert-main-icon">warning</span>
        <span className="pulse-dot"></span>
      </div>

      {/* Main Alert Content */}
      <div className="alert-body">
        <div className="alert-header">
          <h4 className="alert-title">
            <span>{coaching.title}</span>
          </h4>

          <div className="alert-metrics-pills">
            <span className="alert-tag-badge">
              {worstEmotion.emoji} {currentEmotionLabel}
            </span>

            <span className="pill pnl-pill loss">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                trending_down
              </span>
              <span dir="ltr">{formattedLoss}</span>
              {tomanLoss && <span className="toman-sub">({tomanLoss})</span>}
            </span>

            <span className="pill winrate-pill">
              {isEn ? `Win Rate: ${formattedWinRate}` : `نرخ برد: ${formattedWinRate}`}
            </span>

            <span className="pill count-pill">
              {formattedCount}
            </span>
          </div>
        </div>

        <div className="alert-message">
          {isEn ? (
            <>
              Your worst-performing emotion is <strong className="loss-highlight">{currentEmotionLabel}</strong>, which has cost you <strong className="loss-highlight">{formattedLoss}</strong> across {worstEmotion.tradeCount} trades. {coaching.advice}
            </>
          ) : (
            <>
              بیشترین آسیب روانی به معاملات شما از احساس <strong className="loss-highlight">«{currentEmotionLabel}»</strong> بوده که مجموعاً <strong className="loss-highlight">{formattedLoss}</strong> {tomanLoss ? `(${tomanLoss})` : ''} به حساب شما ضرر زده است. {coaching.advice}
            </>
          )}
        </div>

        <div className="alert-actions">
          <Link href="/analytics" className="action-btn primary-action">
            <span className="material-symbols-outlined">insights</span>
            {isEn ? 'View Psychology Analytics' : 'مشاهده تحلیل روانشناسی'}
          </Link>

          {onFilterEmotion && (
            <button
              type="button"
              className="action-btn secondary-action"
              onClick={() => onFilterEmotion(worstEmotion.emotion)}
            >
              <span className="material-symbols-outlined">filter_alt</span>
              {isEn ? `Filter "${worstEmotion.label}" Trades` : `فیلتر معاملات «${worstEmotion.label}»`}
            </button>
          )}
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        className="alert-close-btn"
        onClick={handleDismiss}
        title={isEn ? 'Dismiss for session' : 'بستن در این نشست'}
        aria-label="Close"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
