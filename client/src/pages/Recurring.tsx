import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Repeat, Play, Trash2, Pause, Calendar } from 'lucide-react';
import { useCategories, useCreateRecurring, useDeleteRecurring, useRecurring, useRunRecurring } from '../api/hooks';
import type { Frequency, TxnType } from '../types';
import { fmtCurrency, fmtDate } from '../lib/format';
import { toast } from '../components/ui/Toast';

const FREQ_LABEL: Record<Frequency, string> = {
  daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık',
};

export function RecurringPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  const { data } = useRecurring();
  const run = useRunRecurring();
  const del = useDeleteRecurring();

  const onRun = async () => {
    try {
      const r = await run.mutateAsync();
      toast.success(`${r.generated} işlem üretildi`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Hata');
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Bu tekrarlayan işlem silinsin mi?')) return;
    try {
      await del.mutateAsync(id);
      toast.success('Silindi');
    } catch (e: any) {
      toast.error(e?.message ?? 'Hata');
    }
  };

  return (
    <>
      <Topbar
        title="Tekrarlayan İşlemler"
        subtitle="Otomatik gelir/gider kuralları"
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onRun} leftIcon={<Play className="h-4 w-4" />}>
              Şimdi Çalıştır
            </Button>
            <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Yeni Kural
            </Button>
          </div>
        }
      />

      <Card padding="md">
        <CardHeader title="Aktif Kurallar" subtitle={`${data?.length ?? 0} kayıt`} />
        {!data?.length ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
            <Repeat className="h-10 w-10 opacity-40" />
            <p className="text-sm">Henüz tekrarlayan işlem yok</p>
            <Button onClick={() => setOpen(true)}>İlk kuralı ekle</Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((r) => (
              <li key={r.id} className="glass flex items-center justify-between gap-3 rounded-xl p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                      r.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    {r.type === 'income' ? '+' : '−'}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.description ?? r.category_name ?? 'Tekrarlayan işlem'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-600 dark:text-indigo-300">
                        {FREQ_LABEL[r.frequency]}
                      </span>
                      <span>·</span>
                      <span>Sonraki: {fmtDate(r.next_run_date)}</span>
                      {r.end_date && <><span>·</span><span>Bitiş: {fmtDate(r.end_date)}</span></>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-semibold tabular-nums ${
                    r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {fmtCurrency(r.amount)}
                  </div>
                  {r.is_active === 0 && (
                    <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700/50">
                      <Pause className="mr-1 inline h-3 w-3" /> Pasif
                    </span>
                  )}
                  <button
                    onClick={() => onDelete(r.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-ring"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Tekrarlayan İşlem" description="Belirlenen periyotta otomatik transaction üretir">
        <RecurringForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function RecurringForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const cats = useCategories();
  const create = useCreateRecurring();
  const [type, setType] = useState<TxnType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');

  const filteredCats = cats.data?.filter((c) => c.type === type) ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) { toast.error('Geçerli tutar girin'); return; }
    try {
      await create.mutateAsync({
        type,
        amount: a,
        category_id: categoryId ? Number(categoryId) : null,
        description: description.trim() || null,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
      });
      toast.success('Kural oluşturuldu');
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hata');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setType('expense')}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${type === 'expense' ? 'border-rose-400 bg-rose-500/10 text-rose-600' : 'border-slate-200/60 text-slate-600'}`}>
          Gider
        </button>
        <button type="button" onClick={() => setType('income')}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${type === 'income' ? 'border-emerald-400 bg-emerald-500/10 text-emerald-600' : 'border-slate-200/60 text-slate-600'}`}>
          Gelir
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tutar (₺)">
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Frekans">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
            <option value="yearly">Yıllık</option>
          </Select>
        </Field>
      </div>
      <Field label="Kategori">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">— Seçiniz —</option>
          {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Açıklama">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="opsiyonel" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Başlangıç">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Bitiş (opsiyonel)">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={create.isPending} leftIcon={<Calendar className="h-4 w-4" />}>Oluştur</Button>
      </div>
    </form>
  );
}
