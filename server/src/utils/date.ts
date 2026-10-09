import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isBefore,
  isEqual,
} from 'date-fns';

/** YYYY-MM-DD */
export const DATE_FMT = 'yyyy-MM-dd';
/** YYYY-MM */
export const MONTH_FMT = 'yyyy-MM';

export function todayIso(): string {
  return format(new Date(), DATE_FMT);
}

export function toIsoDate(d: Date | string): string {
  return typeof d === 'string' ? d : format(d, DATE_FMT);
}

export function parseDate(s: string): Date {
  return parseISO(s);
}

export function monthBounds(month: string): { from: string; to: string } {
  const d = parseISO(`${month}-01`);
  return {
    from: format(startOfMonth(d), DATE_FMT),
    to: format(endOfMonth(d), DATE_FMT),
  };
}

export function addMonthsIso(date: string, n: number): string {
  return format(addMonths(parseISO(date), n), DATE_FMT);
}

export function isPastOrToday(date: string): boolean {
  const d = parseISO(date);
  const today = new Date();
  return isBefore(d, today) || isEqual(d, today);
}
