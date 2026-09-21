import { getDb } from '../db/connection.js';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO, eachMonthOfInterval } from 'date-fns';
import { HttpError } from '../middleware/errorHandler.js';

export interface MonthlyReport {
  year: number;
  month: number; // 1-12
  month_str: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
  transaction_count: number;
  category_breakdown: Array<{
    category_id: number | null;
    name: string;
    color: string | null;
    type: 'income' | 'expense';
    total: number;
    count: number;
    percentage: number;
  }>;
  top_expenses: any[];
  daily_trend: Array<{ date: string; income: number; expense: number; net: number }>;
  comparison_prev_month: { income_pct: number; expense_pct: number; net_pct: number };
}

export function getMonthlyReport(year: number, month: number): MonthlyReport {
  if (month < 1 || month > 12) throw new HttpError(400, 'Geçersiz ay');
  const db = getDb();
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense,
         COUNT(*) as count
       FROM transactions WHERE date BETWEEN ? AND ?`,
    )
    .get(startStr, endStr) as { income: number; expense: number; count: number };

  // Önceki ay
  const prev = new Date(year, month - 2, 1);
  const prevStart = format(startOfMonth(prev), 'yyyy-MM-dd');
  const prevEnd = format(endOfMonth(prev), 'yyyy-MM-dd');
  const prevTotals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions WHERE date BETWEEN ? AND ?`,
    )
    .get(prevStart, prevEnd) as { income: number; expense: number };

  const pct = (cur: number, p: number) => (p === 0 ? (cur === 0 ? 0 : 100) : ((cur - p) / p) * 100);

  // Kategori kırılımı (gelir + gider)
  const breakdown = db
    .prepare(
      `SELECT t.category_id, c.name, c.color, t.type,
              COALESCE(SUM(t.amount), 0) as total,
              COUNT(*) as count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.date BETWEEN ? AND ?
       GROUP BY t.category_id, t.type
       ORDER BY total DESC`,
    )
    .all(startStr, endStr) as Array<{ category_id: number | null; name: string | null; color: string | null; type: 'income' | 'expense'; total: number; count: number }>;

  const denom = totals.income + totals.expense;
  const enriched = breakdown.map((b) => ({
    ...b,
    name: b.name ?? (b.type === 'income' ? 'Gelir (kategorisiz)' : 'Gider (kategorisiz)'),
    percentage: denom > 0 ? (b.total / denom) * 100 : 0,
  }));

  // En büyük 5 gider
  const topExpenses = db
    .prepare(
      `SELECT t.id, t.amount, t.description, t.date, c.name as category_name, c.color as category_color
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date BETWEEN ? AND ?
       ORDER BY t.amount DESC LIMIT 5`,
    )
    .all(startStr, endStr);

  // Günlük trend
  const dailyTrend = db
    .prepare(
      `SELECT date,
              COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
              COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions WHERE date BETWEEN ? AND ?
       GROUP BY date ORDER BY date ASC`,
    )
    .all(startStr, endStr) as Array<{ date: string; income: number; expense: number }>;

  return {
    year,
    month,
    month_str: format(start, 'yyyy-MM'),
    income: totals.income,
    expense: totals.expense,
    net: totals.income - totals.expense,
    transaction_count: totals.count,
    category_breakdown: enriched,
    top_expenses: topExpenses,
    daily_trend: dailyTrend.map((d) => ({ ...d, net: d.income - d.expense })),
    comparison_prev_month: {
      income_pct: pct(totals.income, prevTotals.income),
      expense_pct: pct(totals.expense, prevTotals.expense),
      net_pct: pct(totals.income - totals.expense, prevTotals.income - prevTotals.expense),
    },
  };
}

export interface YearlyReport {
  year: number;
  total_income: number;
  total_expense: number;
  total_net: number;
  transaction_count: number;
  months: Array<{ month: string; income: number; expense: number; net: number }>;
  category_breakdown: Array<{ category_id: number | null; name: string; color: string | null; type: 'income' | 'expense'; total: number; percentage: number }>;
  growth: { income_yoy: number; expense_yoy: number; net_yoy: number };
}

export function getYearlyReport(year: number): YearlyReport {
  const db = getDb();
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(start);
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense,
         COUNT(*) as count
       FROM transactions WHERE date BETWEEN ? AND ?`,
    )
    .get(startStr, endStr) as { income: number; expense: number; count: number };

  // Önceki yıl
  const prevStart = format(startOfYear(new Date(year - 1, 0, 1)), 'yyyy-MM-dd');
  const prevEnd = format(endOfYear(new Date(year - 1, 0, 1)), 'yyyy-MM-dd');
  const prevTotals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions WHERE date BETWEEN ? AND ?`,
    )
    .get(prevStart, prevEnd) as { income: number; expense: number };

  // Aylık toplamlar
  const months = eachMonthOfInterval({ start, end }).map((d) => {
    const s = format(startOfMonth(d), 'yyyy-MM-dd');
    const e = format(endOfMonth(d), 'yyyy-MM-dd');
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
         FROM transactions WHERE date BETWEEN ? AND ?`,
      )
      .get(s, e) as { income: number; expense: number };
    return {
      month: format(d, 'yyyy-MM'),
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
    };
  });

  // Yıllık kategori kırılımı
  const breakdown = db
    .prepare(
      `SELECT t.category_id, c.name, c.color, t.type,
              COALESCE(SUM(t.amount), 0) as total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.date BETWEEN ? AND ?
       GROUP BY t.category_id, t.type
       ORDER BY total DESC`,
    )
    .all(startStr, endStr) as Array<{ category_id: number | null; name: string | null; color: string | null; type: 'income' | 'expense'; total: number }>;

  const denom = totals.income + totals.expense;
  const yoy = (cur: number, p: number) => (p === 0 ? (cur === 0 ? 0 : 100) : ((cur - p) / p) * 100);

  return {
    year,
    total_income: totals.income,
    total_expense: totals.expense,
    total_net: totals.income - totals.expense,
    transaction_count: totals.count,
    months,
    category_breakdown: breakdown.map((b) => ({
      ...b,
      name: b.name ?? (b.type === 'income' ? 'Gelir (kategorisiz)' : 'Gider (kategorisiz)'),
      percentage: denom > 0 ? (b.total / denom) * 100 : 0,
    })),
    growth: {
      income_yoy: yoy(totals.income, prevTotals.income),
      expense_yoy: yoy(totals.expense, prevTotals.expense),
      net_yoy: yoy(totals.income - totals.expense, prevTotals.income - prevTotals.expense),
    },
  };
}
