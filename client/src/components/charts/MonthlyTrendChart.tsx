import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { fmtCurrency } from '../../lib/format';

interface Props {
  data: Array<{ month: string; net: number }>;
}

export function MonthlyTrendChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Veri yok
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.06} />
          <XAxis
            dataKey="month"
            stroke="currentColor"
            className="text-xs text-slate-500"
            tickFormatter={(v) => {
              const [, m] = v.split('-');
              const names = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
              return names[Number(m) - 1] ?? m;
            }}
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
            formatter={(v: number) => fmtCurrency(v)}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4, fill: '#6366f1' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
