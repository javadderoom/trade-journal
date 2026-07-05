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
