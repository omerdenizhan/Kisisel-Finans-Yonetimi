import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export function fmtCurrency(value: number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fmtNumber(value: number, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function fmtPercent(value: number, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtDate(iso: string, pattern = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(iso), pattern, { locale: tr });
  } catch {
    return iso;
  }
}

export function fmtDateShort(iso: string): string {
  return fmtDate(iso, 'dd MMM');
}

export function fmtMonth(month: string): string {
  // "2025-06" → "Haziran 2025"
  try {
    return format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: tr });
  } catch {
    return month;
  }
}
