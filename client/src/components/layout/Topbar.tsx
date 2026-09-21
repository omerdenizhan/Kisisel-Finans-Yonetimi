import { Bell, Search, Menu, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { useUiStore } from '../../stores/uiStore';
import { useReminders } from '../../api/hooks';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Topbar({ title, subtitle, right }: Props) {
  const { toggleSidebar, toggleMobileSidebar } = useUiStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: reminders } = useReminders({ upcomingDays: 30 });
  const notifCount = reminders?.filter((r) => !r.is_done).length ?? 0;
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-3 px-4 py-3 md:mx-0 md:px-0 md:py-0">
      <div className="glass-strong flex w-full items-center gap-3 rounded-2xl px-4 py-3 shadow-glass">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Mobil menüyü aç"
          onClick={toggleMobileSidebar}
          className="md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Kenar çubuğunu aç/kapat"
          onClick={toggleSidebar}
          className="hidden md:inline-flex"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        {right && <div className="shrink-0">{right}</div>}

        <div className="hidden items-center gap-2 lg:flex">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Ara…"
              className="input w-48 pl-9"
              aria-label="Genel arama"
            />
          </div>
        </div>

        {/* Kullanıcı Yönetimi Hızlı Buton */}
        <button
          type="button"
          onClick={() => navigate('/admin')}
          title="Kullanıcı Yönetimi & Profil Ayarları"
          className="hidden sm:flex items-center gap-2 rounded-xl glass px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition focus-ring"
        >
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span className="truncate max-w-[120px]">{user?.name || 'Admin'}</span>
        </button>

        <button
          type="button"
          aria-label="Bildirimler"
          onClick={() => navigate('/reminders')}
          className="relative grid h-9 w-9 place-items-center rounded-xl glass hover:scale-105 active:scale-95 transition focus-ring"
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          {notifCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}

