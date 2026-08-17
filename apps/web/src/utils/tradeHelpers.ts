import { toPersianDigits, formatPersianCurrency } from './farsi';
import { useAppStore } from '../store/useAppStore';
import { getEmotionEmoji as _getEmotionEmoji, getEmotionLabel as _getEmotionLabel } from '../constants/emotions';

export const formatCurrency = (val: number, decimals = 2, showPlus = false): string => {
  const lang = useAppStore.getState().language;
  const isEn = lang === 'en';

  if (isEn) {
    const absVal = Math.abs(val).toFixed(decimals);
    const sign = val < 0 ? '-' : showPlus ? '+' : '';
    return `${sign}$${absVal}`;
  }
  return formatPersianCurrency(val, showPlus);
};

export const getNetPnl = (trade: { profitUsd: number; commission?: number | null; swap?: number | null }): number =>
  trade.profitUsd + (trade.commission ?? 0) + (trade.swap ?? 0);

export const getEmotionEmoji = (emotion: string | null, emotionsList?: { value: string; label: string; emoji?: string }[]): string => {
  if (!emotion) return '💭';
  if (emotionsList) {
    const found = emotionsList.find(e => e.value === emotion);
    if (found && found.emoji) return found.emoji;
  }
  return _getEmotionEmoji(emotion);
};

export const getEmotionLabel = (
  emotion: string | null,
  emotionsList?: { value: string; label: string; emoji?: string }[],
  forcedLang?: string
): string => {
  if (!emotion) return '';
  const lang = forcedLang || useAppStore.getState().language;
  const isEn = lang === 'en';
  const trimmed = emotion.trim();
  const upper = trimmed.toUpperCase();

  const persianToEnglish: Record<string, string> = {
    'انتقامی': 'Revenge',
    'فومو': 'FOMO',
    'فومو (عجول)': 'FOMO',
    'مضطرب': 'Anxious',
    'خنثی': 'Neutral',
    'با اطمینان': 'Confident',
    'باطمینان': 'Confident',
    'نامشخص': 'Unknown',
  };

  const englishToPersian: Record<string, string> = {
    CONFIDENT: 'با اطمینان',
    NEUTRAL: 'خنثی',
    ANXIOUS: 'مضطرب',
    FOMO: 'فومو (عجول)',
    REVENGE: 'انتقامی',
    UNKNOWN: 'نامشخص',
  };

  if (isEn) {
    if (persianToEnglish[trimmed]) return persianToEnglish[trimmed];
    if (upper === 'REVENGE') return 'Revenge';
    if (upper === 'FOMO') return 'FOMO';
    if (upper === 'ANXIOUS') return 'Anxious';
    if (upper === 'CONFIDENT') return 'Confident';
    if (upper === 'NEUTRAL') return 'Neutral';
    if (upper === 'UNKNOWN') return 'Unknown';
  } else {
    if (englishToPersian[upper]) return englishToPersian[upper];
    if (persianToEnglish[trimmed]) return trimmed;
  }

  if (emotionsList) {
    const found = emotionsList.find(
      e => e.value === trimmed || e.value.toUpperCase() === upper || e.label === trimmed
    );
    if (found) {
      if (isEn && persianToEnglish[found.label]) {
        return persianToEnglish[found.label];
      }
      if (!isEn && englishToPersian[found.value.toUpperCase()]) {
        return englishToPersian[found.value.toUpperCase()];
      }
      return found.label;
    }
  }

  return emotion;
};

export const formatDate = (dateStr: string, timezone: string): { date: string; day: string } => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, day: '' };

    const lang = useAppStore.getState().language;
    const locale = lang === 'fa' ? 'fa-IR' : 'en-US';

    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const formatted = formatter.format(d);
    const cleanedDate = formatted.replace('،', ' -').replace(',', ' -');

    const dayFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      weekday: 'long'
    });
    const dayLabel = dayFormatter.format(d);

    return {
      date: cleanedDate,
      day: dayLabel,
    };
  } catch {
    return { date: toPersianDigits(dateStr), day: '' };
  }
};

export interface TradingSessionInfo {
  name: string;
  label: string;
  emoji: string;
  className: string;
}

export const getTradingSession = (dateStr: string, override?: string | null): TradingSessionInfo => {
  const lang = useAppStore.getState().language;
  const isEn = lang === 'en';

  const labels = {
    UNKNOWN: isEn ? 'Unknown' : 'نامشخص',
    WEEKEND: isEn ? 'Weekend (Closed)' : 'آخر هفته (بسته)',
    OVERLAP: isEn ? 'London+NY Overlap' : 'لندن+نیویورک',
    LONDON: isEn ? 'London' : 'لندن',
    NEW_YORK: isEn ? 'New York' : 'نیویورک',
    ASIAN: isEn ? 'Tokyo' : 'توکیو',
    SYDNEY: isEn ? 'Sydney' : 'سیدنی',
  };

  if (override) {
    const overUpper = override.toUpperCase();
    if (overUpper === 'LONDON') return { name: 'LONDON', label: labels.LONDON, emoji: '🇬🇧', className: 'session-london' };
    if (overUpper === 'NEW_YORK') return { name: 'NEW_YORK', label: labels.NEW_YORK, emoji: '🇺🇸', className: 'session-ny' };
    if (overUpper === 'OVERLAP') return { name: 'OVERLAP', label: labels.OVERLAP, emoji: '🤝', className: 'session-overlap' };
    if (overUpper === 'ASIA') return { name: 'ASIAN', label: labels.ASIAN, emoji: '🇯🇵', className: 'session-asian' };
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { name: 'UNKNOWN', label: labels.UNKNOWN, emoji: '❓', className: 'session-unknown' };
    }

    const getNYDateTime = (date: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
      });
      const formatted = formatter.format(date);
      const match = formatted.match(/^([A-Za-z]+),\s*(\d+)$/);
      if (!match) return { weekday: '', hour: 0 };
      return { weekday: match[1], hour: parseInt(match[2], 10) };
    };

    const nyInfo = getNYDateTime(d);
    if (
      (nyInfo.weekday === 'Fri' && nyInfo.hour >= 17) ||
      nyInfo.weekday === 'Sat' ||
      (nyInfo.weekday === 'Sun' && nyInfo.hour < 17)
    ) {
      return { name: 'WEEKEND', label: labels.WEEKEND, emoji: '💤', className: 'session-weekend' };
    }

    const getHourInTimezone = (tz: string): number => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        hour12: false,
      });
      return parseInt(formatter.format(d), 10);
    };

    const nyHour = getHourInTimezone('America/New_York');
    const londonHour = getHourInTimezone('Europe/London');
    const tokyoHour = getHourInTimezone('Asia/Tokyo');
    const sydneyHour = getHourInTimezone('Australia/Sydney');

    if (londonHour >= 8 && londonHour < 17 && nyHour >= 8 && nyHour < 17) {
      return { name: 'OVERLAP', label: labels.OVERLAP, emoji: '🤝', className: 'session-overlap' };
    }
    if (londonHour >= 8 && londonHour < 17) {
      return { name: 'LONDON', label: labels.LONDON, emoji: '🇬🇧', className: 'session-london' };
    }
    if (nyHour >= 8 && nyHour < 17) {
      return { name: 'NEW_YORK', label: labels.NEW_YORK, emoji: '🇺🇸', className: 'session-ny' };
    }
    if (tokyoHour >= 9 && tokyoHour < 18) {
      return { name: 'ASIAN', label: labels.ASIAN, emoji: '🇯🇵', className: 'session-asian' };
    }
    if (sydneyHour >= 7 && sydneyHour < 16) {
      return { name: 'SYDNEY', label: labels.SYDNEY, emoji: '🇦🇺', className: 'session-sydney' };
    }
    if (sydneyHour >= 16 || sydneyHour < 7) {
      return { name: 'SYDNEY', label: labels.SYDNEY, emoji: '🇦🇺', className: 'session-sydney' };
    }

    return { name: 'UNKNOWN', label: labels.UNKNOWN, emoji: '❓', className: 'session-unknown' };
  } catch {
    return { name: 'UNKNOWN', label: labels.UNKNOWN, emoji: '❓', className: 'session-unknown' };
  }
};

export const getMainPair = (symbol: string): string => {
  if (!symbol) return '';
  const clean = symbol.trim();
  const base = clean.split(/[\._\+-]/)[0];
  
  const matchForex = base.match(/^([A-Z]{6})[a-z0-9]*$/);
  if (matchForex) {
    return matchForex[1];
  }
  
  return base.toUpperCase();
};

export const getSymbolFilterOptions = (uniqueSymbols: string[]): { value: string; label: string }[] => {
  const groups: { [main: string]: string[] } = {};
  
  uniqueSymbols.forEach(sym => {
    const main = getMainPair(sym);
    if (!groups[main]) {
      groups[main] = [];
    }
    if (!groups[main].includes(sym)) {
      groups[main].push(sym);
    }
  });

  const options: { value: string; label: string }[] = [];
  const mainPairs = Object.keys(groups).sort();
  const allText = useAppStore.getState().language === 'en' ? 'All' : 'همه';

  mainPairs.forEach(main => {
    const syms = groups[main];
    if (syms.length === 1) {
      options.push({
        value: syms[0],
        label: syms[0],
      });
    } else {
      options.push({
        value: `main:${main}`,
        label: `${main} (${allText})`,
      });
      syms.sort().forEach(sym => {
        options.push({
          value: sym,
          label: `\u00A0\u00A0\u00A0\u00A0↳ ${sym}`,
        });
      });
    }
  });

  return options;
};
