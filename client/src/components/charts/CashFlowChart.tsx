import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { fmtCurrency } from '../../lib/format';

interface Props {
  data: Array<{ date: string; amount: number; type: 'income' | 'expense' }>;
}

export function CashFlowChart({ data }: Props) {
  // Tarihe göre grupla, pozitif/negatif ayrımı yap
  const grouped = new Map<string, { date: string; income: number; expense: number; net: number }>();
  for (const d of data) {
    const cur = grouped.get(d.date) ?? { date: d.date, income: 0, expense: 0, net: 0 };
    if (d.type === 'income') cur.income += d.amount;
    else cur.expense += d.amount;
    cur.net = cur.income - cur.expense;
    grouped.set(d.date, cur);
  }
  const rows = Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));

  if (!rows.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Son 30 günde işlem yok
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="cfIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cfExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.06} />
          <XAxis
            dataKey="date"
            stroke="currentColor"
            className="text-xs text-slate-500"
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            stroke="currentColor"
            className="text-xs text-slate-500"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 12,
              color: '#f1f5f9',
            }}
            formatter={(v: number, n) => [fmtCurrency(v), n === 'income' ? 'Gelir' : 'Gider']}
          />
          <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#cfIncome)" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#cfExpense)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
