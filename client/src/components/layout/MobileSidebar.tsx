import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CalendarClock, Repeat, Wallet, Target,
  FileBarChart2, Settings, X, Sparkles, ShieldCheck, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

const NAV = [
  { to: '/',             label: 'Ana Panel',    icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'İşlemler',    icon: ArrowLeftRight },
  { to: '/installments', label: 'Taksitler',   icon: CalendarClock },
  { to: '/recurring',    label: 'Tekrarlayan', icon: Repeat },
  { to: '/budgets',      label: 'Bütçeler',    icon: Wallet },
  { to: '/goals',        label: 'Hedefler',    icon: Target },
  { to: '/reminders',    label: 'Hatırlatıcılar', icon: CalendarClock },
  { to: '/reports',      label: 'Raporlar',    icon: FileBarChart2 },
  { to: '/admin',        label: 'Kullanıcı Yönetimi', icon: ShieldCheck },
  { to: '/settings',     label: 'Ayarlar',     icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: Props) {
  const loc = useLocation();
  const { user, logout } = useAuthStore();

  useEffect(() => { onClose(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [loc.pathname]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobil menü"
            className="fixed inset-y-0 left-0 z-50 w-72 glass-strong shadow-glass md:hidden"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', duration: 0.25 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200/40 px-5 py-4 dark:border-slate-700/40">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-glow">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Kişisel Finans Yönetimi</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">{user?.name || 'Ömer Denizhan'}</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Menüyü kapat"
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        isActive
                          ? 'bg-brand-600 text-white shadow-glow'
                          : 'text-slate-600 hover:bg-white/40 dark:text-slate-300 dark:hover:bg-slate-800/40',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-slate-200/40 p-3 dark:border-slate-700/40">
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

