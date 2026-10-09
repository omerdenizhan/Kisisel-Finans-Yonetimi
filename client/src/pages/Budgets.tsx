import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Wallet, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBudgets, useCategories, useCreateBudget, useDeleteBudget } from '../api/hooks';
import { fmtCurrency, fmtMonth } from '../lib/format';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function BudgetsPage(): JSX.Element {
  const [month, setMonth] = useState(currentMonth());
  const { data } = useBudgets(month);
  const del = useDeleteBudget();
  const [open, setOpen] = useState(false);

  const onDelete = async (id: number) => {
    if (!confirm('Bu bütçe silinsin mi?')) return;
    try { await del.mutateAsync(id); toast.success('Silindi'); }
    catch (e: any) { toast.error(e?.message ?? 'Hata'); }
  };

  const totalAmount = data?.reduce((s, b) => s + b.amount, 0) ?? 0;
  const totalSpent = data?.reduce((s, b) => s + b.spent, 0) ?? 0;
  const overBudget = data?.filter((b) => b.spent > b.amount) ?? [];

  return (
    <>
      <Topbar
        title="Bütçeler"
        subtitle={`${fmtMonth(month)} ayı`}
        right={
          <div className="flex gap-2">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Yeni Bütçe</Button>
          </div>
        }
      />

      {data && data.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card padding="md">
            <div className="card-title">Toplam Bütçe</div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{fmtCurrency(totalAmount)}</div>
          </Card>
          <Card padding="md">
            <div className="card-title">Harcanan</div>
            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{fmtCurrency(totalSpent)}</div>
          </Card>
          <Card padding="md">
            <div className="card-title">Aşım Uyarısı</div>
            <div className="mt-1 flex items-center gap-2">
              {overBudget.length > 0
                ? <><AlertTriangle className="h-5 w-5 text-rose-500" /><span className="text-2xl font-bold text-rose-600">{overBudget.length}</span></>
                : <><CheckCircle2 className="h-5 w-5 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">Uygun</span></>
              }
            </div>
          </Card>
        </div>
      )}

      <Card padding="md">
        <CardHeader title="Kategori Bütçeleri" subtitle={`${data?.length ?? 0} kayıt`} />
        {!data?.length ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
            <Wallet className="h-10 w-10 opacity-40" />
            <p className="text-sm">Bu ay için bütçe yok</p>
            <Button onClick={() => setOpen(true)}>İlk bütçeyi ekle</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((b) => {
              const isOver = b.spent > b.amount;
              const tone: 'emerald' | 'rose' | 'indigo' | 'amber' = isOver ? 'rose' : b.usage > 0.8 ? 'amber' : 'emerald';
              return (
                <li key={b.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.category_color ?? '#94a3b8' }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{b.category_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {fmtCurrency(b.spent)} / {fmtCurrency(b.amount)}
                          {isOver && <span className="ml-2 font-semibold text-rose-500">+{fmtCurrency(b.spent - b.amount)} aşım</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(b.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-ring"
                      aria-label="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={b.usage} tone={tone} showLabel label="Kullanım" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Bütçe" description={`${fmtMonth(month)} ayı için kategori bütçesi`}>
        <BudgetForm month={month} onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function BudgetForm({ month, onDone, onCancel }: { month: string; onDone: () => void; onCancel: () => void }) {
  const cats = useCategories('expense');
  const create = useCreateBudget();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (!categoryId) { toast.error('Kategori seçin'); return; }
    if (!Number.isFinite(a) || a <= 0) { toast.error('Geçerli tutar girin'); return; }
    try {
      await create.mutateAsync({ category_id: Number(categoryId), amount: a, month });
      toast.success('Bütçe eklendi');
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hata');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Kategori (sadece gider)">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">— Seçiniz —</option>
          {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Aylık Limit (₺)">
        <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={create.isPending}>Ekle</Button>
      </div>
    </form>
  );
}
