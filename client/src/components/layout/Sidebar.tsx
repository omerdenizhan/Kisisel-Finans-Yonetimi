import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarClock,
  Repeat,
  Wallet,
  Target,
  FileBarChart2,
  Settings,
  Sparkles,
  Bell,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const NAV = [
  { to: '/',             label: 'Ana Panel',    icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'İşlemler',    icon: ArrowLeftRight },
  { to: '/installments', label: 'Taksitler',   icon: CalendarClock },
  { to: '/recurring',    label: 'Tekrarlayan', icon: Repeat },
  { to: '/budgets',      label: 'Bütçeler',    icon: Wallet },
  { to: '/goals',        label: 'Hedefler',    icon: Target },
  { to: '/reminders',    label: 'Hatırlatıcılar', icon: Bell },
  { to: '/reports',      label: 'Raporlar',    icon: FileBarChart2 },
  { to: '/admin',        label: 'Kullanıcı Yönetimi', icon: ShieldCheck },
  { to: '/settings',     label: 'Ayarlar',     icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 border-r glass-divider md:block',
        sidebarOpen ? 'w-64' : 'w-20',
        'transition-[width] duration-200',
      )}
      aria-label="Ana menü"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Kişisel Finans Yönetimi
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                {user?.name || 'Ömer Denizhan'}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t glass-divider space-y-2">
          <button
            onClick={() => logout()}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all',
              !sidebarOpen && 'justify-center',
            )}
            title="Güvenli Çıkış Yap"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Çıkış Yap</span>}
          </button>

          {sidebarOpen && (
            <div className="px-1 text-[11px] text-slate-500 dark:text-slate-400">
              <p>Kişisel Finans Yönetimi v1.0.8</p>
              <p className="text-secondary">Yönetici: {user?.name || 'Ömer Denizhan'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

