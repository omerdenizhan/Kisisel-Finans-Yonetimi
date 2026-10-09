import { create } from 'zustand';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: string; kind: ToastKind; message: string }

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().push('success', m),
  error:   (m: string) => useToastStore.getState().push('error', m),
  info:    (m: string) => useToastStore.getState().push('info', m),
  warning: (m: string) => useToastStore.getState().push('warning', m),
};

const KIND: Record<ToastKind, { icon: any; tone: string }> = {
  success: { icon: CheckCircle2, tone: 'text-emerald-500' },
  error:   { icon: XCircle,      tone: 'text-rose-500' },
  info:    { icon: Info,         tone: 'text-indigo-500' },
  warning: { icon: AlertTriangle, tone: 'text-amber-500' },
};

export function ToastHost() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = KIND[t.kind].icon;
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-3 text-left shadow-glass"
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', KIND[t.kind].tone)} />
              <div className="text-sm text-slate-700 dark:text-slate-200">{t.message}</div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Hook that triggers a side effect once (kullanım örneği için) */
export function useEffectOnce(fn: () => void) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fn, []);
}
