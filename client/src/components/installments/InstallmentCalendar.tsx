import { useState } from 'react';
import { motion } from 'framer-motion';
import { fmtCurrency, fmtDate } from '../../lib/format';
import type { Installment, InstallmentPayment } from '../../types';
import { Check, Undo2, CalendarClock } from 'lucide-react';
import { usePayInstallment, useUnpayInstallment } from '../../api/hooks';
import { toast } from '../ui/Toast';

interface Props {
  installment: Installment;
}

export function InstallmentCalendar({ installment }: Props) {
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const pay = usePayInstallment();
  const unpay = useUnpayInstallment();

  const payments = (installment.payments ?? []).filter((p) => {
    if (filter === 'paid') return p.is_paid === 1;
    if (filter === 'unpaid') return p.is_paid === 0;
    return true;
  });

  const onPay = async (p: InstallmentPayment) => {
    try {
      await pay.mutateAsync({ id: installment.id, paymentId: p.id });
      toast.success('Taksit ödendi');
    } catch (e: any) {
      toast.error(e?.message ?? 'Hata');
    }
  };

  const onUnpay = async (p: InstallmentPayment) => {
    if (!confirm('Taksit ödemesini geri almak istediğinizden emin misiniz?')) return;
    try {
      await unpay.mutateAsync({ id: installment.id, paymentId: p.id });
      toast.info('Taksit geri alındı');
    } catch (e: any) {
      toast.error(e?.message ?? 'Hata');
    }
  };

  if (!payments.length) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">Bu filtreye uyan taksit yok</div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Tümü</FilterChip>
        <FilterChip active={filter === 'unpaid'} onClick={() => setFilter('unpaid')}>Ödenmemiş</FilterChip>
        <FilterChip active={filter === 'paid'} onClick={() => setFilter('paid')}>Ödenmiş</FilterChip>
      </div>

      <ul className="space-y-1.5">
        {payments.map((p) => {
          const isPaid = p.is_paid === 1;
          const overdue = !isPaid && new Date(p.due_date) < new Date(new Date().toDateString());
          return (
            <motion.li
              key={p.id}
              layout
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                isPaid
                  ? 'border-emerald-200/40 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-950/20'
                  : overdue
                    ? 'border-rose-200/40 bg-rose-50/30 dark:border-rose-500/20 dark:bg-rose-950/20'
                    : 'border-slate-200/40 bg-white/40 dark:border-slate-700/40 dark:bg-slate-800/30'
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  isPaid
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    : overdue
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                      : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                }`}
              >
                {p.sequence}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {fmtCurrency(p.amount)}
                  {isPaid && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">ÖDENDİ</span>}
                  {overdue && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-300">GECİKMİŞ</span>}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isPaid && p.paid_date ? `Ödeme: ${fmtDate(p.paid_date)} · ` : ''}
                  Vade: {fmtDate(p.due_date)}
                </div>
              </div>
              <div className="shrink-0">
                {isPaid ? (
                  <button
                    onClick={() => onUnpay(p)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
                    aria-label="Ödemeyi geri al"
                    title="Geri al"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onPay(p)}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-300 focus-ring"
                    aria-label="Öde"
                    title="Öde"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
          : 'border-slate-200/60 text-slate-600 hover:bg-white/60 dark:border-slate-700/50 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
