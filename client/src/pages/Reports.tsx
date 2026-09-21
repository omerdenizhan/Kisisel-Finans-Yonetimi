import { useState } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { FileBarChart2, Download, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useMonthlyReport, useYearlyReport, type MonthlyReport, type YearlyReport } from '../api/hooks';
import { fmtCurrency, fmtMonth, fmtPercent } from '../lib/format';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { BudgetGaugeChart } from '../components/charts/BudgetGaugeChart';
import { toast } from '../components/ui/Toast';
import { motion } from 'framer-motion';

type Mode = 'monthly' | 'yearly';

function currentYear() { return new Date().getFullYear(); }
function currentMonth() { return new Date().getMonth() + 1; }

export function ReportsPage(): JSX.Element {
  const [mode, setMode] = useState<Mode>('monthly');
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());

  const monthly = useMonthlyReport(year, month);
  const yearly = useYearlyReport(year);

  const data = (mode === 'monthly' ? monthly.data : yearly.data) as (MonthlyReport | YearlyReport | undefined);
  const isLoading = mode === 'monthly' ? monthly.isLoading : yearly.isLoading;
  const isError = mode === 'monthly' ? monthly.isError : yearly.isError;

  const downloadFile = async (url: string, kind: 'pdf' | 'xlsx') => {
    try {
      const token = localStorage.getItem('kisisel_finans_auth_token');
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('İndirilemedi');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const ext = kind === 'pdf' ? '.pdf' : '.xlsx';
      const rawPart = url.split('?')[0].split('/').pop() ?? 'export';
      const cleanName = rawPart.replace(/\.(pdf|xlsx)$/i, '');
      const downloadName = mode === 'monthly'
        ? `${cleanName}-${year}-${String(month).padStart(2, '0')}${ext}`
        : `${cleanName}-${year}${ext}`;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success('İndirme başladı');
    } catch (e: any) {
      toast.error(e?.message ?? 'İndirme hatası');
    }
  };

  const buildExportUrl = (kind: 'pdf' | 'xlsx') => {
    if (mode === 'monthly') {
      const lastDay = new Date(year, month, 0).getDate();
      return `/api/export/transactions.${kind}?dateFrom=${year}-${String(month).padStart(2, '0')}-01&dateTo=${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
    return `/api/export/transactions.${kind}?dateFrom=${year}-01-01&dateTo=${year}-12-31`;
  };

  const buildReportUrl = (kind: 'pdf' | 'xlsx') => {
    return `/api/export/report.${kind}?type=${mode}&year=${year}${mode === 'monthly' ? `&month=${month}` : ''}`;
  };

  return (
    <>
      <Topbar
        title="Raporlar"
        subtitle={mode === 'monthly' ? `${fmtMonth(`${year}-${String(month).padStart(2, '0')}`)} ayı detayı` : `${year} yılı özeti`}
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => downloadFile(buildReportUrl('pdf'), 'pdf')} leftIcon={<Download className="h-4 w-4" />}>
              PDF
            </Button>
            <Button variant="secondary" onClick={() => downloadFile(buildReportUrl('xlsx'), 'xlsx')} leftIcon={<Download className="h-4 w-4" />}>
              Excel
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="glass inline-flex rounded-xl p-1">
          <button
            onClick={() => setMode('monthly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'monthly' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-600 hover:bg-white/60 dark:text-slate-300'
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => setMode('yearly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'yearly' ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-600 hover:bg-white/60 dark:text-slate-300'
            }`}
          >
            Yıllık
          </button>
        </div>
        <Input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value) || currentYear())} className="w-24" />
        {mode === 'monthly' && (
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-32">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{fmtMonth(`${year}-${String(m).padStart(2, '0')}`)}</option>
            ))}
          </Select>
        )}
      </div>

      {isLoading && <Card><div className="py-10 text-center text-sm text-slate-500">Yükleniyor…</div></Card>}

      {isError && (
        <Card className="border border-rose-300/40">
          <p className="text-sm text-rose-600">Rapor yüklenemedi</p>
        </Card>
      )}

      {data && !isLoading && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mode === 'monthly' ? (
              (() => {
                const md = data as MonthlyReport;
                const incChange = md.comparison_prev_month?.income_pct ?? 0;
                const expChange = md.comparison_prev_month?.expense_pct ?? 0;
                const incSign = incChange > 0 ? '+' : '';
                const expSign = expChange > 0 ? '+' : '';
                return (
                  <>
                    <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Gelir" value={fmtCurrency(md.income ?? 0)} tone="emerald" hint={md.comparison_prev_month ? `Önceki aya göre ${incSign}${fmtPercent(incChange / 100)}` : undefined} />
                    <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Gider" value={fmtCurrency(md.expense ?? 0)} tone="rose" hint={md.comparison_prev_month ? `Önceki aya göre ${expSign}${fmtPercent(expChange / 100)}` : undefined} />
                    <StatCard icon={<Wallet className="h-5 w-5" />} label="Net" value={fmtCurrency(md.net ?? 0)} tone="indigo" />
                    <StatCard icon={<FileBarChart2 className="h-5 w-5" />} label="İşlem Sayısı" value={String(md.transaction_count ?? 0)} tone="slate" />
                  </>
                );
              })()
            ) : (
              (() => {
                const yd = data as YearlyReport;
                const incChange = yd.growth?.income_yoy ?? 0;
                const expChange = yd.growth?.expense_yoy ?? 0;
                const incSign = incChange > 0 ? '+' : '';
                const expSign = expChange > 0 ? '+' : '';
                return (
                  <>
                    <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Gelir" value={fmtCurrency(yd.total_income ?? 0)} tone="emerald" hint={yd.growth ? `Geçen yıla göre ${incSign}${fmtPercent(incChange / 100)}` : undefined} />
                    <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Gider" value={fmtCurrency(yd.total_expense ?? 0)} tone="rose" hint={yd.growth ? `Geçen yıla göre ${expSign}${fmtPercent(expChange / 100)}` : undefined} />
                    <StatCard icon={<Wallet className="h-5 w-5" />} label="Net" value={fmtCurrency(yd.total_net ?? 0)} tone="indigo" />
                    <StatCard icon={<FileBarChart2 className="h-5 w-5" />} label="İşlem Sayısı" value={String(yd.transaction_count ?? 0)} tone="slate" />
                  </>
                );
              })()
            )}
          </section>

          {mode === 'monthly' && (() => {
            const md = data as MonthlyReport;
            const dailyData = (md.daily_trend ?? []).flatMap((d) => [
              { date: d.date, amount: d.income, type: 'income' as const },
              { date: d.date, amount: d.expense, type: 'expense' as const },
            ]);
            const breakdownData = (md.category_breakdown ?? [])
              .filter((b) => b.total > 0)
              .map((b) => ({
                name: b.name,
                value: b.total,
                color: b.color ?? '#94a3b8',
              }));

            return (
              <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2" padding="lg">
                  <CardHeader title="Nakit Akışı" subtitle="Günlük gelir/gider eğilimi" />
                  <CashFlowChart data={dailyData} />
                </Card>
                <Card>
                  <CardHeader title="Bütçe Disiplini" subtitle="Bu ay" />
                  <BudgetGaugeChart
                    spent={md.expense ?? 0}
                    budget={Math.max(md.expense ?? 0, (md.income ?? 0) * 0.8)}
                    label="Harcama / Beklenti"
                  />
                </Card>
                <Card className="lg:col-span-2" padding="md">
                  <CardHeader title="Kategori Kırılımı" subtitle="Gelir & gider" />
                  <CategoryPieChart data={breakdownData} />
                </Card>
                <Card padding="md">
                  <CardHeader title="En Büyük 5 Gider" />
                  <ul className="space-y-2">
                    {(md.top_expenses ?? []).map((t) => (
                      <li key={t.id} className="flex items-center gap-2 rounded-xl p-2 hover:bg-white/40 dark:hover:bg-slate-800/30">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.category_color ?? '#94a3b8' }} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{t.description ?? '—'}</div>
                          <div className="text-xs text-slate-500">{t.category_name ?? '—'}</div>
                        </div>
                        <div className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                          {fmtCurrency(t.amount)}
                        </div>
                      </li>
                    ))}
                    {(!md.top_expenses || md.top_expenses.length === 0) && (
                      <li className="py-6 text-center text-sm text-slate-500">Veri yok</li>
                    )}
                  </ul>
                </Card>
              </section>
            );
          })()}

          {mode === 'yearly' && (() => {
            const yd = data as YearlyReport;
            const breakdownData = (yd.category_breakdown ?? [])
              .filter((b) => b.total > 0)
              .map((b) => ({
                name: b.name,
                value: b.total,
                color: b.color ?? '#94a3b8',
              }));

            return (
              <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-3" padding="lg">
                  <CardHeader title="Aylık Karşılaştırma" subtitle={`${year} yılı`} />
                  <YearlyBars data={yd.months ?? []} />
                </Card>
                <Card className="lg:col-span-2" padding="md">
                  <CardHeader title="Kategori Kırılımı" subtitle="Tüm yıl" />
                  <CategoryPieChart data={breakdownData} />
                </Card>
                <Card padding="md">
                  <CardHeader title="Yıllık Büyüme" subtitle="Geçen yıla göre" />
                  <div className="space-y-3">
                    <GrowthRow label="Gelir" pct={yd.growth?.income_yoy ?? 0} good />
                    <GrowthRow label="Gider" pct={yd.growth?.expense_yoy ?? 0} good={false} />
                    <GrowthRow label="Net" pct={yd.growth?.net_yoy ?? 0} good={(yd.growth?.net_yoy ?? 0) >= 0} />
                  </div>
                </Card>
              </section>
            );
          })()}

          <Card padding="md" className="mt-6">
            <CardHeader
              title="Dışa Aktar"
              subtitle="Bu raporu PDF veya Excel olarak indirin"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => downloadFile(buildReportUrl('pdf'), 'pdf')} leftIcon={<Download className="h-4 w-4" />}>
                Raporu PDF indir
              </Button>
              <Button variant="secondary" onClick={() => downloadFile(buildReportUrl('xlsx'), 'xlsx')} leftIcon={<Download className="h-4 w-4" />}>
                Raporu Excel indir
              </Button>
              <Button variant="ghost" onClick={() => downloadFile(buildExportUrl('pdf'), 'pdf')} leftIcon={<Calendar className="h-4 w-4" />}>
                İşlemler (PDF)
              </Button>
              <Button variant="ghost" onClick={() => downloadFile(buildExportUrl('xlsx'), 'xlsx')} leftIcon={<Calendar className="h-4 w-4" />}>
                İşlemler (Excel)
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function StatCard({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone: 'emerald' | 'rose' | 'indigo' | 'slate' }) {
  const toneClass = {
    emerald: 'from-emerald-500/20 to-emerald-500/0 text-emerald-600 dark:text-emerald-400',
    rose: 'from-rose-500/20 to-rose-500/0 text-rose-600 dark:text-rose-400',
    indigo: 'from-indigo-500/20 to-indigo-500/0 text-indigo-600 dark:text-indigo-400',
    slate: 'from-slate-500/20 to-slate-500/0 text-slate-600 dark:text-slate-300',
  }[tone];
  return (
    <Card className="relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${toneClass} blur-2xl`} aria-hidden />
      <div className="relative">
        <div className="card-title">{label}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
        {hint && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{hint}</div>}
      </div>
      <div className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg bg-white/40 dark:bg-slate-800/40 ${toneClass.split(' ').slice(-2).join(' ')}`}>
        {icon}
      </div>
    </Card>
  );
}

function YearlyBars({ data }: { data: Array<{ month: string; income: number; expense: number; net: number }> }) {
  if (!data?.length) return null;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  return (
    <div className="grid grid-cols-12 gap-2">
      {data.map((d, i) => {
        const monthNum = Number(d.month.split('-')[1]) || (i + 1);
        const monthName = monthNames[monthNum - 1] ?? d.month;
        return (
          <motion.div
            key={d.month}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-32 w-full items-end gap-1">
              <div
                className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-500"
                style={{ height: `${(d.income / max) * 100}%`, minHeight: d.income > 0 ? '2px' : 0 }}
                title={`Gelir: ${fmtCurrency(d.income)}`}
              />
              <div
                className="flex-1 rounded-t bg-gradient-to-t from-rose-500/40 to-rose-500"
                style={{ height: `${(d.expense / max) * 100}%`, minHeight: d.expense > 0 ? '2px' : 0 }}
                title={`Gider: ${fmtCurrency(d.expense)}`}
              />
            </div>
            <div className="text-[10px] font-semibold text-slate-500">{monthName}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

function GrowthRow({ label, pct, good }: { label: string; pct: number; good: boolean }) {
  const safePct = Number.isFinite(pct) ? pct : 0;
  const isPos = safePct >= 0;
  const tone = isPos === good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const Icon = isPos ? TrendingUp : TrendingDown;
  const sign = safePct > 0 ? '+' : '';
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/40 p-3 dark:border-slate-700/40">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
      <div className={`flex items-center gap-1 text-sm font-bold ${tone}`}>
        <Icon className="h-4 w-4" />
        {sign}{fmtPercent(Math.abs(safePct) / 100)}
      </div>
    </div>
  );
}

