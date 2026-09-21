import { useState } from 'react';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCategories, useCreateInstallment } from '../../api/hooks';
import { toast } from '../ui/Toast';

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export function InstallmentForm({ onDone, onCancel }: Props) {
  const cats = useCategories('expense');
  const create = useCreateInstallment();

  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [count, setCount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(total);
    const c = Number(count);
    if (!name.trim()) { toast.error('İsim gerekli'); return; }
    if (!Number.isFinite(t) || t <= 0) { toast.error('Geçerli bir tutar girin'); return; }
    if (!Number.isInteger(c) || c <= 0) { toast.error('Taksit sayısı pozitif tam sayı olmalı'); return; }
    if (!startDate) { toast.error('Başlangıç tarihi seçin'); return; }
    try {
      await create.mutateAsync({
        name: name.trim(),
        total_amount: t,
        installment_count: c,
        start_date: startDate,
        category_id: categoryId ? Number(categoryId) : null,
        notes: notes.trim() || null,
      });
      toast.success(`${c} taksit oluşturuldu`);
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hata');
    }
  };

  const preview = (() => {
    const t = Number(total);
    const c = Number(count);
    if (!Number.isFinite(t) || !Number.isInteger(c) || c <= 0) return null;
    const base = Math.floor((t * 100) / c) / 100;
    return base;
  })();

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Alım Adı">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="örn. Dizüstü Bilgisayar" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Toplam Tutar (₺)">
          <Input type="number" step="0.01" min="0" value={total} onChange={(e) => setTotal(e.target.value)} required />
        </Field>
        <Field label="Taksit Sayısı">
          <Input type="number" min="1" step="1" value={count} onChange={(e) => setCount(e.target.value)} required />
        </Field>
      </div>
      {preview != null && (
        <div className="rounded-xl border border-indigo-200/40 bg-indigo-50/50 p-3 text-sm text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-indigo-300">
          Aylık yaklaşık taksit: <b>{preview.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</b>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Başlangıç Ayı">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="Kategori">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— Seçiniz —</option>
            {cats.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notlar">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsiyonel" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={create.isPending}>Oluştur</Button>
      </div>
    </form>
  );
}
