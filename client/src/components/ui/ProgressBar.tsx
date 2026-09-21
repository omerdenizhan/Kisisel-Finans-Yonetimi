import { cn } from '../../lib/utils';

interface Props {
  value: number; // 0..1
  tone?: 'emerald' | 'rose' | 'indigo' | 'amber';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
}

const TONE: Record<NonNullable<Props['tone']>, string> = {
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  rose: 'bg-gradient-to-r from-rose-500 to-rose-400',
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
};

export function ProgressBar({ value, tone = 'indigo', size = 'md', showLabel, label }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
          <span className="tabular-nums text-slate-500 dark:text-slate-400">{Math.round(pct * 100)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/40',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', TONE[tone])}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
