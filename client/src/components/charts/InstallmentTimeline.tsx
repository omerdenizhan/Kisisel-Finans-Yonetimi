import { useMemo } from 'react';
import { fmtCurrency, fmtDateShort } from '../../lib/format';
import type { Installment, InstallmentPayment } from '../../types';

interface Props {
  installments: Installment[];
}

export function InstallmentTimeline({ installments }: Props) {
  const events = useMemo(() => {
    const all: Array<{ date: string; amount: number; name: string; paid: boolean }> = [];
    for (const i of installments) {
      const payments: InstallmentPayment[] = (i as any).payments ?? [];
      if (payments.length) {
        for (const p of payments) {
          all.push({ date: p.due_date, amount: p.amount, name: i.name, paid: p.is_paid === 1 });
        }
      } else {
        // Liste görünümünde sadece özet olarak toplam ekleme
        all.push({ date: i.start_date, amount: i.installment_amount, name: `${i.name} (1/${i.installment_count})`, paid: false });
      }
    }
    return all.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 30);
  }, [installments]);

  if (!events.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Henüz taksit planı yok
      </div>
    );
  }

  // Timeline görseli için basit liste
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {events.map((e, i) => (
        <div key={i} className="glass flex items-center gap-3 rounded-xl p-2.5">
          <div className="grid h-8 w-12 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
            {fmtDateShort(e.date).split(' ').reverse().join(' ')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">{e.name}</div>
            <div className="text-[10px] text-slate-500">Vade: {fmtDateShort(e.date)}</div>
          </div>
          <div className={`shrink-0 text-sm font-semibold tabular-nums ${e.paid ? 'text-slate-400 line-through' : 'text-rose-600 dark:text-rose-400'}`}>
            {fmtCurrency(e.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}
