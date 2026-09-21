import { getDb } from '../db/connection.js';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
export function getDashboardSummary(month) {
    const db = getDb();
    const now = new Date();
    const target = month ? parseISO(`${month}-01`) : now;
    const monthStr = format(target, 'yyyy-MM');
    const monthStart = format(startOfMonth(target), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(target), 'yyyy-MM-dd');
    // Bu ay toplamları
    const monthRow = db
        .prepare(`SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE date BETWEEN ? AND ?`)
        .get(monthStart, monthEnd);
    // Tüm zamanlar toplamları
    const totals = db
        .prepare(`SELECT
         COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions`)
        .get();
    // Yaklaşan taksitler (vadesi geçmiş veya bugün ve henüz ödenmemiş, max 6)
    const upcoming = db
        .prepare(`SELECT ip.id, ip.due_date, ip.amount, ip.installment_id, i.name
       FROM installment_payments ip
       JOIN installments i ON i.id = ip.installment_id
       WHERE ip.is_paid = 0 AND ip.due_date <= date('now', '+30 days')
       ORDER BY ip.due_date ASC
       LIMIT 6`)
        .all();
    const upcomingCount = db
        .prepare(`SELECT COUNT(*) as c FROM installment_payments WHERE is_paid = 0`)
        .get().c;
    const upcomingRemaining = db
        .prepare(`SELECT COALESCE(SUM(amount),0) as s FROM installment_payments WHERE is_paid = 0`)
        .get().s;
    const nextOne = upcoming[0] ?? null;
    // Yaklaşan hatırlatıcılar
    const reminders = db
        .prepare(`SELECT id, title, due_date, amount FROM reminders
       WHERE is_done = 0 AND due_date <= date('now', '+30 days')
       ORDER BY due_date ASC LIMIT 5`)
        .all();
    // Son 10 işlem
    const recent = db
        .prepare(`SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       ORDER BY t.date DESC, t.id DESC LIMIT 10`)
        .all();
    // Aylık trend: son 6 ay
    const trend = [];
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(target, i);
        const s = format(startOfMonth(d), 'yyyy-MM-dd');
        const e = format(endOfMonth(d), 'yyyy-MM-dd');
        const row = db
            .prepare(`SELECT
           COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as income,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
         FROM transactions WHERE date BETWEEN ? AND ?`)
            .get(s, e);
        trend.push({
            month: format(d, 'yyyy-MM'),
            income: row.income,
            expense: row.expense,
            net: row.income - row.expense,
        });
    }
    // Kategori dağılımı (bu ay, giderler)
    const catDist = db
        .prepare(`SELECT c.name as name, c.color as color, COALESCE(SUM(t.amount),0) as value
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date BETWEEN ? AND ?
       GROUP BY t.category_id
       ORDER BY value DESC LIMIT 8`)
        .all(monthStart, monthEnd);
    // Cash flow: son 30 gün
    const cfStart = format(subMonths(now, 1), 'yyyy-MM-dd');
    const cashFlow = db
        .prepare(`SELECT date, type, amount FROM transactions
       WHERE date >= ? ORDER BY date ASC`)
        .all(cfStart);
    return {
        month: monthStr,
        income: monthRow.income,
        expense: monthRow.expense,
        net: monthRow.income - monthRow.expense,
        total_income: totals.income,
        total_expense: totals.expense,
        total_balance: totals.income - totals.expense,
        upcoming_installments: {
            count: upcomingCount,
            remaining_amount: upcomingRemaining,
            next_due_date: nextOne?.due_date ?? null,
            next_amount: nextOne?.amount ?? null,
        },
        upcoming_reminders: reminders,
        recent_transactions: recent,
        charts: {
            monthly_trend: trend,
            income_vs_expense: trend.map(({ month, income, expense }) => ({ month, income, expense })),
            category_distribution: catDist.map((c) => ({
                name: c.name ?? 'Diğer',
                value: c.value,
                color: c.color ?? '#94a3b8',
            })),
            cash_flow: cashFlow,
        },
    };
}
