import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from 'lucide-react';
import { fmtCurrency, fmtDate } from '../../lib/format';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeleteTransaction } from '../../api/hooks';
import { toast } from '../ui/Toast';

interface Props {
  items: Transaction[];
  onEdit: (t: Transaction) => void;
}

export function TransactionList({ items, onEdit }: Props) {
  const del = useDeleteTransaction();

  const onDelete = async (t: Transaction) => {
    if (!confirm(`"${t.description ?? 'Bu işlem'}" silinsin mi?`)) return;
    try {
      await del.mutateAsync(t.id);
      toast.success('İşlem silindi');
    } catch (e: any) {
      toast.error(e?.message ?? 'Silinemedi');
    }
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-500 dark:text-slate-400">
        <p className="text-sm">Filtreye uyan işlem yok.</p>
        <p className="text-xs">Yeni bir işlem ekleyerek başlayın.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      {/* Masaüstü tablo */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <th className="px-3 py-2 font-medium">Tarih</th>
            <th className="px-3 py-2 font-medium">Kategori</th>
            <th className="px-3 py-2 font-medium">Açıklama</th>
            <th className="px-3 py-2 text-right font-medium">Tutar</th>
            <th className="px-3 py-2 text-right font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {items.map((t) => (
              <motion.tr
                key={t.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="border-t border-slate-200/40 dark:border-slate-700/40"
              >
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{fmtDate(t.date)}</td>
                <td className="px-3 py-3">
                  {t.category_name ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: t.category_color ?? '#94a3b8' }}
                      />
                      <span className="text-slate-700 dark:text-slate-200">{t.category_name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                  {t.description ?? <span className="text-slate-400">—</span>}
                </td>
                <td className={`px-3 py-3 text-right font-semibold tabular-nums ${
                  t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {t.type === 'income' ? '+' : '−'} {fmtCurrency(t.amount)}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      aria-label="Düzenle"
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-ring"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      aria-label="Sil"
                      className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition focus-ring"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {/* Mobil kart listesi */}
      <ul className="space-y-2 md:hidden">
        {items.map((t) => (
          <li key={t.id} className="glass rounded-xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {t.type === 'income' ? (
                    <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  {fmtDate(t.date)} · {t.category_name ?? '—'}
                </div>
                <div className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t.description ?? '—'}
                </div>
              </div>
              <div className={`shrink-0 text-sm font-semibold ${
                t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {t.type === 'income' ? '+' : '−'} {fmtCurrency(t.amount)}
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => onEdit(t)}>
                <Pencil className="h-3.5 w-3.5" /> Düzenle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(t)}>
                <Trash2 className="h-3.5 w-3.5" /> Sil
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
