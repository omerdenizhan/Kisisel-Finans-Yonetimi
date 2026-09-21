import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { fmtCurrency } from '../../lib/format';

interface Props {
  data: Array<{ month: string; income: number; expense: number }>;
}

export function IncomeVsExpenseChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Gelir" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
