import { Card, CardHeader } from '../components/ui/Card';
import { Topbar } from '../components/layout/Topbar';
import { TrendingUp, TrendingDown, Wallet, CalendarClock, Bell, ArrowRight, Plus, ShieldCheck } from 'lucide-react';
import { fmtCurrency, fmtDate, fmtMonth } from '../lib/format';
import { useDashboard } from '../api/hooks';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { IncomeVsExpenseChart } from '../components/charts/IncomeVsExpenseChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const navigate = useNavigate();

  return (
    <>
      <Topbar
        title="Ana Panel"
        subtitle={data ? `${fmtMonth(data.month)} · anlık özet` : 'Yükleniyor…'}
        right={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/transactions')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Yeni İşlem
            </Button>
          </div>
        }
      />

      {isError && (
        <Card className="mb-4 border border-rose-300/40">
          <p className="text-sm text-rose-600 dark:text-rose-300">
            Ana panel verileri yüklenemedi. API çalışıyor mu?
          </p>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Bu Ay Gelir"
          value={data ? fmtCurrency(data.income) : '—'}
          accent="emerald"
        />
        <SummaryCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Bu Ay Gider"
          value={data ? fmtCurrency(data.expense) : '—'}
          accent="rose"
        />
        <SummaryCard
          icon={<Wallet className="h-5 w-5" />}
          label="Net Bakiye"
          value={data ? fmtCurrency(data.net) : '—'}
          accent="indigo"
        />
        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Yaklaşan Taksit"
          value={
            data?.upcoming_installments?.next_due_date
              ? fmtCurrency(data.upcoming_installments.remaining_amount)
              : 'Yok'
          }
          hint={data?.upcoming_installments?.next_due_date ?? undefined}
          accent="amber"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <CardHeader
            title="Gelir vs Gider"
            subtitle="Son 6 ay"
          />
          {data ? (
            <IncomeVsExpenseChart data={data.charts.income_vs_expense} />
          ) : (
            <Skeleton h="h-64" />
          )}
        </Card>

        <Card>
          <CardHeader title="Kategori Dağılımı" subtitle="Bu ay giderler" />
          {data ? <CategoryPieChart data={data.charts.category_distribution} /> : <Skeleton h="h-64" />}
        </Card>

        <Card className="lg:col-span-2" padding="lg">
          <CardHeader title="Nakit Akışı" subtitle="Son 30 gün" />
          {data ? <CashFlowChart data={data.charts.cash_flow} /> : <Skeleton h="h-64" />}
        </Card>

        <Card>
          <CardHeader title="Aylik Trend" subtitle="Net değişim" />
          {data ? <MonthlyTrendChart data={data.charts.monthly_trend} /> : <Skeleton h="h-64" />}
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Son İşlemler"
            right={
              <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
                Tümü <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <ul className="space-y-2">
            {isLoading && <li className="py-6 text-center text-sm text-slate-500">Yükleniyor…</li>}
            {data?.recent_transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/40 dark:hover:bg-slate-800/30 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: t.category_color ?? '#94a3b8' }}
                    />
                    {fmtDate(t.date)} · {t.category_name ?? '—'}
                  </div>
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t.description ?? '—'}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    t.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {t.type === 'income' ? '+' : '−'} {fmtCurrency(t.amount)}
                </div>
              </li>
            ))}
            {data && data.recent_transactions.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">Henüz işlem yok</li>
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Yaklaşan Hatırlatıcılar"
            right={<Bell className="h-4 w-4 text-slate-400" />}
          />
          <ul className="space-y-2">
            {data?.upcoming_reminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl p-2">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(r.due_date)}</div>
                </div>
                {r.amount != null && (
                  <div className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {fmtCurrency(r.amount)}
                  </div>
                )}
              </li>
            ))}
            {data && data.upcoming_reminders.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">Yaklaşan hatırlatıcı yok</li>
            )}
          </ul>
        </Card>
      </section>
    </>
  );
}

type Accent = 'emerald' | 'rose' | 'indigo' | 'amber';
const ACCENT: Record<Accent, string> = {
  emerald: 'from-emerald-500/20 to-emerald-500/0 text-emerald-600 dark:text-emerald-400',
  rose: 'from-rose-500/20 to-rose-500/0 text-rose-600 dark:text-rose-400',
  indigo: 'from-indigo-500/20 to-indigo-500/0 text-indigo-600 dark:text-indigo-400',
  amber: 'from-amber-500/20 to-amber-500/0 text-amber-600 dark:text-amber-400',
};

function SummaryCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent: Accent;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${ACCENT[accent]} blur-2xl`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="card-title">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          {hint && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Son: {hint}</div>}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 ${ACCENT[accent].split(' ').slice(-2).join(' ')}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function Skeleton({ h }: { h: string }) {
  return <div className={`${h} animate-pulse rounded-xl bg-slate-200/40 dark:bg-slate-700/30`} />;
}
