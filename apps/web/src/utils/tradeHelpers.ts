import { toPersianDigits } from './farsi';

export const getEmotionEmoji = (emotion: string | null): string => {
  switch (emotion) {
    case 'CONFIDENT': return '😌';
    case 'NEUTRAL': return '😐';
    case 'ANXIOUS': return '😰';
    case 'FOMO': return '🎯';
    case 'REVENGE': return '😡';
    default: return '💭';
  }
};

export const getEmotionLabel = (emotion: string | null, emotionsList: { value: string; label: string }[]): string => {
  if (!emotion) return '';
  const found = emotionsList.find(e => e.value === emotion);
  return found ? found.label : emotion;
};

export const formatDate = (dateStr: string, timezone: string): { date: string; day: string } => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, day: '' };

    const formatter = new Intl.DateTimeFormat('fa-IR', {
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

    const dayFormatter = new Intl.DateTimeFormat('fa-IR', {
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

export const getTradingSession = (dateStr: string): TradingSessionInfo => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { name: 'UNKNOWN', label: 'نامشخص', emoji: '❓', className: 'session-unknown' };
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
      return { name: 'WEEKEND', label: 'آخر هفته (بسته)', emoji: '💤', className: 'session-weekend' };
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
      return { name: 'OVERLAP', label: 'لندن+نیویورک', emoji: '🤝', className: 'session-overlap' };
    }
    if (londonHour >= 8 && londonHour < 17) {
      return { name: 'LONDON', label: 'لندن', emoji: '🇬🇧', className: 'session-london' };
    }
    if (nyHour >= 8 && nyHour < 17) {
      return { name: 'NEW_YORK', label: 'نیویورک', emoji: '🇺🇸', className: 'session-ny' };
    }
    if (tokyoHour >= 9 && tokyoHour < 18) {
      return { name: 'ASIAN', label: 'توکیو', emoji: '🇯🇵', className: 'session-asian' };
    }
    if (sydneyHour >= 7 && sydneyHour < 16) {
      return { name: 'SYDNEY', label: 'سیدنی', emoji: '🇦🇺', className: 'session-sydney' };
    }
    if (sydneyHour >= 16 || sydneyHour < 7) {
      return { name: 'SYDNEY', label: 'سیدنی', emoji: '🇦🇺', className: 'session-sydney' };
    }

    return { name: 'UNKNOWN', label: 'نامشخص', emoji: '❓', className: 'session-unknown' };
  } catch {
    return { name: 'UNKNOWN', label: 'نامشخص', emoji: '❓', className: 'session-unknown' };
  }
};

export const getMainPair = (symbol: string): string => {
  if (!symbol) return '';
  const clean = symbol.trim();
  // Split by common separators: ., _, +, -
  const base = clean.split(/[\._\+-]/)[0];
  
  // If the base ends with lowercase suffix (e.g. EURUSDpro, XAUUSDraw), strip trailing lowercase/numeric characters
  // Forex/Commodities bases are typically 6 uppercase letters (e.g. EURUSD).
  const matchForex = base.match(/^([A-Z]{6})[a-z0-9]*$/);
  if (matchForex) {
    return matchForex[1];
  }
  
  // Default to just the uppercase base
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

  mainPairs.forEach(main => {
    const syms = groups[main];
    if (syms.length === 1) {
      options.push({
        value: syms[0],
        label: syms[0],
      });
    } else {
      // Main pair group
      options.push({
        value: `main:${main}`,
        label: `${main} (همه)`,
      });
      // Indented sub-pairs using non-breaking spaces
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

export const isTradeIgnored = (tags: string[] | undefined | null): boolean => {
  if (!tags || !Array.isArray(tags)) return false;
  return tags.some(tag => 
    ['فرصت از دست رفته', 'Missed', 'ignore', 'Ignore', 'نادیده گرفتن'].includes(tag)
  );
};

