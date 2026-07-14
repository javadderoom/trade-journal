import { useAppStore } from '../store/useAppStore';

/**
 * Converts English digits (0-9) in any string or number to Persian digits (۰-۹)
 */
export function toPersianDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  
  try {
    if (useAppStore.getState().language === 'en') {
      return str;
    }
  } catch (e) {}

  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Converts Persian/Arabic digits and thousand separators to ASCII for parsing.
 * Handles: ۰-۹ (Persian), ٠-٩ (Arabic), and comma/period separators.
 */
export function toAsciiDigits(input: string): string {
  const persianToLatin: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  const arabicToLatin: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };

  let result = input;
  for (const [persian, latin] of Object.entries(persianToLatin)) {
    result = result.replaceAll(persian, latin);
  }
  for (const [arabic, latin] of Object.entries(arabicToLatin)) {
    result = result.replaceAll(arabic, latin);
  }
  // Remove thousand separators (commas) but preserve decimal point
  result = result.replace(/,/g, '');
  return result;
}

/**
 * Normalizes a numeric input string: converts Farsi/Arabic digits, strips commas,
 * and returns a clean string safe for parseFloat/Number().
 * Returns the original string if empty.
 */
export function normalizeNumericInput(value: string): string {
  if (!value) return value;
  return toAsciiDigits(value.trim());
}

/**
 * Formats a number with thousand separators and converts it to Persian digits
 */
export function formatPersianNumber(val: number, decimals: number = 2): string {
  const fixed = val.toFixed(decimals).replace(/\.?0+$/, ''); // Remove trailing zeros
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts.join('.');
  
  try {
    if (useAppStore.getState().language === 'en') {
      return formatted;
    }
  } catch (e) {}

  return toPersianDigits(formatted);
}

/**
 * Formats a number or string for display, converting to Persian digits if locale is fa
 */
export function formatNum(num: number | string): string {
  try {
    if (useAppStore.getState().language === 'en') {
      return num.toString();
    }
  } catch (e) {}
  return toPersianDigits(num.toString());
}

/**
 * Formats net profit/loss into a currency string using Persian digits (e.g. +$۳۷۵.۰۰ or -$۲۰۰.۰۰)
 */
export function formatPersianCurrency(val: number): string {
  const prefix = val > 0 ? '+' : val < 0 ? '-' : '';
  const absVal = Math.abs(val).toFixed(2);

  // Format thousand separator
  const parts = absVal.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedAbs = parts.join('.');

  try {
    if (useAppStore.getState().language === 'en') {
      return `${prefix}$${formattedAbs}`;
    }
  } catch (e) {}

  return `${prefix}$${toPersianDigits(formattedAbs)}`;
}

/**
 * Formats a USD profit/loss value as Iranian Tomans.
 * Abbreviates large numbers: 1,000,000+ → X میلیون تومان, 1,000+ → X هزار تومان
 */
export function formatToman(usd: number, usdToToman: number): string {
  try {
    if (useAppStore.getState().language === 'en') {
      return '';
    }
  } catch (e) {}

  const prefix = usd > 0 ? '+' : usd < 0 ? '-' : '';
  const tomans = Math.abs(usd) * usdToToman;

  let display: string;
  let suffix: string;
  if (tomans >= 1_000_000) {
    display = formatPersianNumber(tomans / 1_000_000, 1);
    suffix = ' میلیون';
  } else if (tomans >= 1_000) {
    display = formatPersianNumber(tomans / 1_000, 0);
    suffix = ' هزار';
  } else {
    display = formatPersianNumber(tomans, 0);
    suffix = '';
  }

  return `${display}${prefix}${suffix} ت`;
}

// ─── Jalali (Persian) Calendar Helpers ────────────────────────────────────────

/**
 * Converts a Gregorian Date to Jalali calendar parts { year, month, day }
 */
export function getJalaliParts(date: Date): { year: number; month: number; day: number } {
  try {
    const formatted = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tehran'
    }).format(date);
    const clean = formatted.replace(' AP', '');
    const [mStr, dStr, yStr] = clean.split('/');
    return {
      year: parseInt(yStr, 10),
      month: parseInt(mStr, 10),
      day: parseInt(dStr, 10)
    };
  } catch {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }
}

/**
 * Converts Jalali date parts to a Gregorian Date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const gYear = jy + 621;
  let dayOffset = 0;
  if (jm <= 6) {
    dayOffset = (jm - 1) * 31 + jd;
  } else {
    dayOffset = 186 + (jm - 7) * 30 + jd;
  }

  const date = new Date(gYear, 2, 18); // March 18th
  date.setDate(date.getDate() + dayOffset - 1);

  // Search local window to find exact match
  for (let i = 0; i < 10; i++) {
    const parts = getJalaliParts(date);
    if (parts.year === jy && parts.month === jm && parts.day === jd) {
      return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }

  return new Date(gYear, 2, 21); // Fallback
}

/**
 * Returns the number of days in a given Jalali month
 */
export function getJalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Check Esfand leap year length
  const testDate = jalaliToGregorian(jy, 12, 30);
  const parts = getJalaliParts(testDate);
  return parts.day === 30 ? 30 : 29;
}
