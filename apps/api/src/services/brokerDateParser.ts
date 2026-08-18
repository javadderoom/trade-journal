/**
 * Utility for parsing dates from MT4/MT5 statements and EA payloads with timezone & DST support.
 */
export function parseBrokerDate(dateStr: string | number | Date, timezone: string = 'EET'): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'number') {
    return dateStr > 1e11 ? new Date(dateStr) : new Date(dateStr * 1000);
  }

  const cleanStr = String(dateStr).trim();
  if (!cleanStr) return null;

  if (cleanStr.includes('T') && (cleanStr.includes('Z') || cleanStr.includes('+'))) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const parts = cleanStr.split(/[\sT]+/);
  if (parts.length < 2) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const dateParts = parts[0].split(/[\.\-\/]/);
  const timeParts = parts[1].split(':');
  if (dateParts.length < 3 || timeParts.length < 2) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10);

  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

  // Determine Offset based on Timezone
  let offsetHours = 0;
  if (timezone === 'GMT') {
    offsetHours = 0;
  } else if (timezone === 'EST') {
    // US Eastern Time (UTC-5, DST is UTC-4)
    // US DST: 2nd Sunday of March to 1st Sunday of November
    let isDST = false;
    if (month > 2 && month < 10) {
      isDST = true;
    } else if (month === 2) {
      const firstDay = new Date(Date.UTC(year, 2, 1));
      let secondSunday = 1 + (7 - firstDay.getUTCDay());
      if (firstDay.getUTCDay() === 0) secondSunday = 8;
      else secondSunday += 7;
      
      const dUTC = new Date(Date.UTC(year, 2, day));
      if (dUTC.getUTCDate() >= secondSunday) isDST = true;
    } else if (month === 10) {
      const firstDay = new Date(Date.UTC(year, 10, 1));
      let firstSunday = 1 + (7 - firstDay.getUTCDay());
      if (firstDay.getUTCDay() === 0) firstSunday = 1;
      
      const dUTC = new Date(Date.UTC(year, 10, day));
      if (dUTC.getUTCDate() < firstSunday) isDST = true;
    }
    offsetHours = isDST ? -4 : -5;
  } else {
    // Default to EET/EEST
    let isDST = false;
    if (month > 2 && month < 9) {
      isDST = true;
    } else if (month === 2) {
      const lastSunday = new Date(Date.UTC(year, 2, 31));
      lastSunday.setUTCDate(31 - lastSunday.getUTCDay());
      const dUTC = new Date(Date.UTC(year, 2, day));
      if (dUTC >= lastSunday) isDST = true;
    } else if (month === 9) {
      const lastSunday = new Date(Date.UTC(year, 9, 31));
      lastSunday.setUTCDate(31 - lastSunday.getUTCDay());
      const dUTC = new Date(Date.UTC(year, 9, day));
      if (dUTC < lastSunday) isDST = true;
    }
    offsetHours = isDST ? 3 : 2;
  }

  const d = new Date(Date.UTC(year, month, day, hour - offsetHours, minute, second));
  return isNaN(d.getTime()) ? null : d;
}
