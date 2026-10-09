import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Target, Trash2, Trophy, ArrowUp } from 'lucide-react';
import { useCreateGoal, useDeleteGoal, useGoalProgress, useGoals } from '../api/hooks';
import { fmtCurrency, fmtDate } from '../lib/format';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';

export function GoalsPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [progressFor, setProgressFor] = useState<number | null>(null);
  const { data } = useGoals();
  const del = useDeleteGoal();

  const onDelete = async (id: number) => {
    if (!confirm('Bu hedef silinsin mi?')) return;
    try { await del.mutateAsync(id); toast.success('Silindi'); }
    catch (e: any) { toast.error(e?.message ?? 'Hata'); }
  };

  return (
    <>
      <Topbar
        title="Hedefler"
        subtitle="Finansal hedeflerinizi takip edin"
        right={<Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Yeni Hedef</Button>}
      />

      {!data?.length ? (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
            <Target className="h-10 w-10 opacity-40" />
            <p className="text-sm">Henüz hedef yok</p>
            <Button onClick={() => setOpen(true)}>İlk hedefi ekle</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.map((g) => {
            const pct = g.target_amount > 0 ? g.current_amount / g.target_amount : 0;
            const done = g.is_completed === 1;
            return (
              <Card key={g.id} padding="lg" className="relative overflow-hidden">
                {done && (
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/0 blur-2xl" />
                )}
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {done && <Trophy className="h-4 w-4 text-amber-500" />}
                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{g.name}</h3>
                      </div>
                      {g.target_date && (
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Hedef tarih: {fmtDate(g.target_date)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onDelete(g.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-ring"
                      aria-label="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Biriken</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {fmtCurrency(g.current_amount)} / {fmtCurrency(g.target_amount)}
                        </span>
                      </div>
                      <ProgressBar value={pct} tone={done ? 'emerald' : pct > 0.8 ? 'amber' : 'indigo'} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setProgressFor(g.id)}
                        leftIcon={<ArrowUp className="h-3.5 w-3.5" />}
                      >
                        İlerleme Ekle
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Hedef" description="Uzun vadeli finansal hedef tanımlayın">
        <GoalForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>

      <Modal open={progressFor != null} onClose={() => setProgressFor(null)} title="İlerleme Ekle" description="Mevcut birikmiş tutara ekleme yapın">
        {progressFor != null && <ProgressForm goalId={progressFor} onDone={() => setProgressFor(null)} onCancel={() => setProgressFor(null)} />}
      </Modal>
    </>
  );
}

function GoalForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const create = useCreateGoal();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = Number(target);
    const c = Number(current);
    if (!name.trim()) { toast.error('İsim gerekli'); return; }
    if (!Number.isFinite(t) || t <= 0) { toast.error('Geçerli hedef tutar girin'); return; }
    if (!Number.isFinite(c) || c < 0) { toast.error('Geçerli mevcut tutar girin'); return; }
    try {
      await create.mutateAsync({
        name: name.trim(),
        target_amount: t,
        current_amount: c,
        target_date: targetDate || null,
        notes: notes.trim() || null,
      });
      toast.success('Hedef oluşturuldu');
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hata');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Hedef Adı">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="örn. Yeni Motor" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hedef Tutar (₺)">
          <Input type="number" step="0.01" min="0" value={target} onChange={(e) => setTarget(e.target.value)} required />
        </Field>
        <Field label="Mevcut Birikim (₺)">
          <Input type="number" step="0.01" min="0" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
      </div>
      <Field label="Hedef Tarih (opsiyonel)">
        <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </Field>
      <Field label="Notlar">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="opsiyonel" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={create.isPending}>Oluştur</Button>
      </div>
    </form>
  );
}

function ProgressForm({ goalId, onDone, onCancel }: { goalId: number; onDone: () => void; onCancel: () => void }) {
  const progress = useGoalProgress();
  const [delta, setDelta] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = Number(delta);
    if (!Number.isFinite(d)) { toast.error('Geçerli tutar girin'); return; }
    try {
      await progress.mutateAsync({ id: goalId, delta: d });
      toast.success('İlerleme güncellendi');
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hata');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Eklenecek Tutar (₺)" hint="Negatif değer girerek azaltabilirsiniz">
        <Input type="number" step="0.01" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="örn. 5000" required />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={progress.isPending}>Güncelle</Button>
      </div>
    </form>
  );
}
