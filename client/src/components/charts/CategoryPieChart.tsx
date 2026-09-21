import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { fmtCurrency } from '../../lib/format';

interface Props {
  data: Array<{ name: string; value: number; color: string }>;
}

export function CategoryPieChart({ data }: Props) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Henüz gider kaydı yok
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 12,
              color: '#f1f5f9',
            }}
            formatter={(v: number) => fmtCurrency(v)}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
