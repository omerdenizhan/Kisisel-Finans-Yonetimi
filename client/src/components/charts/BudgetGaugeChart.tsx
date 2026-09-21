import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { fmtCurrency, fmtPercent } from '../../lib/format';

interface Props {
  spent: number;
  budget: number;
  label?: string;
}

export function BudgetGaugeChart({ spent, budget, label = 'Bütçe' }: Props) {
  const usage = budget > 0 ? spent / budget : 0;
  const clamped = Math.min(usage, 1.5); // chart için
  const remaining = Math.max(0, 1 - usage);
  const overshoot = Math.max(0, usage - 1);

  const data = [
    { name: 'Kullanılan', value: Math.min(usage, 1) },
    { name: 'Kalan',      value: remaining },
    ...(overshoot > 0 ? [{ name: 'Aşım', value: Math.min(overshoot, 0.5) }] : []),
  ];

  const color = usage > 1 ? '#ef4444' : usage > 0.8 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative h-48 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="65%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="100%"
            stroke="none"
            paddingAngle={2}
          >
            <Cell fill={color} />
            <Cell fill="rgba(148,163,184,0.2)" />
            {overshoot > 0 && <Cell fill="#ef4444" />}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
        <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
          {fmtPercent(usage)}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {fmtCurrency(spent)} / {fmtCurrency(budget)}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </div>
  );
}
