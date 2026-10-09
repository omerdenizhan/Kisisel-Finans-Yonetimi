import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, CalendarClock, Trash2 } from 'lucide-react';
import { fmtCurrency } from '../lib/format';
import { useDeleteInstallment, useInstallment, useInstallments } from '../api/hooks';
import { InstallmentForm } from '../components/installments/InstallmentForm';
import { InstallmentCalendar } from '../components/installments/InstallmentCalendar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';

export function InstallmentsPage(): JSX.Element {
  const [openNew, setOpenNew] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const { data: items, isLoading } = useInstallments();
  const { data: active } = useInstallment(activeId);
  const del = useDeleteInstallment();

  const onDelete = async (id: number) => {
    if (!confirm('Bu taksit planı ve ilgili tüm ödemeler silinsin mi?')) return;
    try {
      await del.mutateAsync(id);
      toast.success('Taksit planı silindi');
      if (activeId === id) setActiveId(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Silinemedi');
    }
  };

  return (
    <>
      <Topbar
        title="Taksitler"
        subtitle="Taksitli alımlar ve ödeme planları"
        right={
          <Button onClick={() => setOpenNew(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Yeni Taksit
          </Button>
        }
      />

      {isLoading && <Card><div className="py-10 text-center text-sm text-slate-500">Yükleniyor…</div></Card>}

      {items && items.length === 0 && (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
            <CalendarClock className="h-10 w-10 opacity-50" />
            <p className="text-sm">Henüz taksitli alım yok</p>
            <Button onClick={() => setOpenNew(true)} leftIcon={<Plus className="h-4 w-4" />}>
              İlk taksiti ekle
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {items?.map((i) => {
            const pct = (i.installment_count ?? 0) > 0 ? (i.paid_count ?? 0) / i.installment_count : 0;
            const isActive = activeId === i.id;
            return (
              <Card
                key={i.id}
                padding="md"
                className={`cursor-pointer transition hover:scale-[1.01] ${isActive ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => setActiveId(i.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {i.category_color && (
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.category_color }} />
                      )}
                      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {i.name}
                      </h3>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {i.paid_count}/{i.installment_count} taksit ödendi
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(i.id); }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-ring"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Kalan: {fmtCurrency(i.remaining_amount ?? 0)}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{fmtCurrency(i.total_amount)}</span>
                  </div>
                  <ProgressBar
                    value={pct}
                    tone={pct >= 1 ? 'emerald' : 'indigo'}
                    size="sm"
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {items && items.length > 0 && (
          <div className="lg:col-span-3">
            {active ? (
              <Card padding="lg">
                <CardHeader
                  title={active.name}
                  subtitle={`${active.installment_count} taksit · Aylık ${fmtCurrency(active.installment_amount)} · Başlangıç ${active.start_date}`}
                />
                <InstallmentCalendar installment={active} />
              </Card>
            ) : (
              <Card padding="lg">
                <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
                  <CalendarClock className="h-10 w-10 opacity-40" />
                  <p className="text-sm">Detayları görmek için bir taksit seçin</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Yeni Taksitli Alım" description="Aylık ödeme planı otomatik oluşturulur">
        <InstallmentForm onDone={() => setOpenNew(false)} onCancel={() => setOpenNew(false)} />
      </Modal>
    </>
  );
}
