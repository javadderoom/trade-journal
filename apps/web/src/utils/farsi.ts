/**
 * Converts English digits (0-9) in any string or number to Persian digits (۰-۹)
 */
export function toPersianDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
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
  
  return `${prefix}$${toPersianDigits(formattedAbs)}`;
}
