import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Bell, Trash2, Check } from 'lucide-react';
import { useCreateReminder, useDeleteReminder, useReminders, useToggleReminder } from '../api/hooks';
import { fmtCurrency, fmtDate } from '../lib/format';
import { toast } from '../components/ui/Toast';

export function RemindersView(): JSX.Element {
  const [open, setOpen] = useState(false);
  const { data } = useReminders({ includeDone: true, upcomingDays: 365 });
  const toggle = useToggleReminder();
  const del = useDeleteReminder();

  const onDelete = async (id: number) => {
    if (!confirm('Hatırlatıcı silinsin mi?')) return;
    try { await del.mutateAsync(id); toast.success('Silindi'); }
    catch (e: any) { toast.error(e?.message ?? 'Hata'); }
  };

  const onToggle = async (id: number, current: boolean) => {
    try { await toggle.mutateAsync({ id, is_done: !current }); }
    catch (e: any) { toast.error(e?.message ?? 'Hata'); }
  };

  return (
    <>
      <Topbar
        title="Hatırlatıcılar"
        subtitle="Yaklaşan ödemeler ve görevler"
        right={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Yeni</Button>}
      />

      <Card padding="md">
        <CardHeader title="Tüm Hatırlatıcılar" subtitle={`${data?.length ?? 0} kayıt`} />
        {!data?.length ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
            <Bell className="h-10 w-10 opacity-40" />
            <p className="text-sm">Henüz hatırlatıcı yok</p>
            <Button onClick={() => setOpen(true)}>İlk hatırlatıcıyı ekle</Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((r) => {
              const done = r.is_done === 1;
              const overdue = !done && new Date(r.due_date) < new Date(new Date().toDateString());
              return (
                <li
                  key={r.id}
                  className={`glass flex items-center gap-3 rounded-xl p-3 ${done ? 'opacity-60' : ''}`}
                >
                  <button
                    onClick={() => onToggle(r.id, done)}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 transition ${
                      done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 hover:border-emerald-400 dark:border-slate-600'
                    }`}
                    aria-label={done ? 'Tamamlandı işaretini kaldır' : 'Tamamlandı olarak işaretle'}
                  >
                    {done && <Check className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {r.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {fmtDate(r.due_date)}
                      {overdue && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-semibold text-rose-500">GECİKMİŞ</span>}
                      {r.type && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-indigo-600 dark:text-indigo-300">{r.type}</span>}
                    </div>
                  </div>
                  {r.amount != null && (
                    <div className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {fmtCurrency(r.amount)}
                    </div>
                  )}
                  <button
                    onClick={() => onDelete(r.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-ring"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Hatırlatıcı" description="Tarihli görev veya fatura hatırlatması">
        <ReminderForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function ReminderForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const create = useCreateReminder();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('custom');
  const [notes, setNotes] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Başlık gerekli'); return; }
    const a = amount ? Number(amount) : null;
    try {
      await create.mutateAsync({
        title: title.trim(),
        due_date: dueDate,
        amount: a != null && Number.isFinite(a) ? a : null,
        type,
        notes: notes.trim() || null,
      });
      toast.success('Hatırlatıcı eklendi');
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hata');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Başlık">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="örn. Elektrik faturası" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarih">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </Field>
        <Field label="Tutar (opsiyonel)">
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      <Field label="Tür">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="custom">Genel</option>
          <option value="bill">Fatura</option>
          <option value="goal">Hedef</option>
        </Select>
      </Field>
      <Field label="Notlar">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="opsiyonel" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={create.isPending}>Ekle</Button>
      </div>
    </form>
  );
}
