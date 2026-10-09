import { useEffect, useState } from 'react';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCategories, useCreateTransaction, useUpdateTransaction } from '../../api/hooks';
import type { Transaction, TxnType } from '../../types';
import { toast } from '../ui/Toast';

interface Props {
  initial?: Transaction;
  onDone: () => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, onDone, onCancel }: Props) {
  const isEdit = Boolean(initial);
  const [type, setType] = useState<TxnType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ? String(initial.category_id) : '');
  const [date, setDate] = useState<string>(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');

  const cats = useCategories(type);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();

  // Tip değişince kategori sıfırlansın
  useEffect(() => {
    if (!cats.data) return;
    if (categoryId && !cats.data.find((c) => String(c.id) === categoryId)) setCategoryId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    if (!date) {
      toast.error('Tarih seçin');
      return;
    }
    const payload = {
      type,
      amount: a,
      category_id: categoryId ? Number(categoryId) : null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      date,
    };
    try {
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, ...payload });
        toast.success('İşlem güncellendi');
      } else {
        await create.mutateAsync(payload);
        toast.success('İşlem eklendi');
      }
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bir hata oluştu');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
            type === 'expense'
              ? 'border-rose-400 bg-rose-500/10 text-rose-600 dark:text-rose-300'
              : 'border-slate-200/60 text-slate-600 hover:bg-white/60 dark:border-slate-700/50 dark:text-slate-300'
          }`}
        >
          Gider
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
            type === 'income'
              ? 'border-emerald-400 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              : 'border-slate-200/60 text-slate-600 hover:bg-white/60 dark:border-slate-700/50 dark:text-slate-300'
          }`}
        >
          Gelir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tutar (₺)">
          <Input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
          />
        </Field>
        <Field label="Tarih">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>

      <Field label="Kategori">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">— Seçiniz —</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Açıklama">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="örn. Haziran maaşı"
        />
      </Field>

      <Field label="Notlar">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ek bilgi (opsiyonel)"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {isEdit ? 'Güncelle' : 'Ekle'}
        </Button>
      </div>
    </form>
  );
}
