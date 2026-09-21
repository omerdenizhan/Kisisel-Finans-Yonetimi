import { useMemo, useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus } from 'lucide-react';
import { fmtCurrency } from '../lib/format';
import { useTransactions, type TxnFilters } from '../api/hooks';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionFilters, EMPTY_FILTERS, type Filters } from '../components/transactions/TransactionFilters';
import type { Transaction } from '../types';

export function TransactionsPage(): JSX.Element {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Transaction | undefined>();

  const apiFilters: TxnFilters = useMemo(
    () => ({
      q: filters.q || undefined,
      type: filters.type || undefined,
      categoryId: filters.categoryId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      min: filters.min ? Number(filters.min) : undefined,
      max: filters.max ? Number(filters.max) : undefined,
      limit: 100,
      offset: 0,
    }),
    [filters],
  );

  const { data, isLoading, isError } = useTransactions(apiFilters);

  const onEdit = (t: Transaction) => {
    setEdit(t);
    setOpen(true);
  };

  return (
    <>
      <Topbar
        title="İşlemler"
        subtitle="Tüm gelir ve gider kayıtları"
        right={
          <Button onClick={() => { setEdit(undefined); setOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Yeni İşlem
          </Button>
        }
      />

      <Card className="mb-4">
        <TransactionFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />
      </Card>

      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SmallStat label="Filtre Geliri" value={fmtCurrency(data.income)} tone="emerald" />
          <SmallStat label="Filtre Gideri" value={fmtCurrency(data.expense)} tone="rose" />
          <SmallStat label="Net" value={fmtCurrency(data.net)} tone="indigo" />
          <SmallStat label="Toplam Kayıt" value={String(data.total)} tone="slate" />
        </div>
      )}

      <Card padding="sm">
        <CardHeader title="İşlem Listesi" subtitle={`${data?.items.length ?? 0} kayıt gösteriliyor`} />
        {isLoading && <div className="py-10 text-center text-sm text-slate-500">Yükleniyor…</div>}
        {isError && <div className="py-10 text-center text-sm text-rose-500">İşlemler yüklenemedi</div>}
        {data && <TransactionList items={data.items} onEdit={onEdit} />}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? 'İşlemi Düzenle' : 'Yeni İşlem'}
        description={edit ? 'Mevcut kaydı güncelleyin' : 'Gelir veya gider kaydı ekleyin'}
      >
        <TransactionForm
          initial={edit}
          onDone={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function SmallStat({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'rose' | 'indigo' | 'slate' }) {
  const toneClass = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    slate: 'text-slate-700 dark:text-slate-200',
  }[tone];
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-base font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
