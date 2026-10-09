import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/Dashboard';
import { LoginPage } from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastHost } from './components/ui/Toast';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';

// Code splitting — sayfaları ayrı chunk'lara böl
const TransactionsPage = lazy(() => import('./pages/Transactions').then((m) => ({ default: m.TransactionsPage })));
const InstallmentsPage = lazy(() => import('./pages/Installments').then((m) => ({ default: m.InstallmentsPage })));
const RecurringPage = lazy(() => import('./pages/Recurring').then((m) => ({ default: m.RecurringPage })));
const BudgetsPage = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.BudgetsPage })));
const GoalsPage = lazy(() => import('./pages/Goals').then((m) => ({ default: m.GoalsPage })));
const RemindersView = lazy(() => import('./pages/RemindersView').then((m) => ({ default: m.RemindersView })));
const ReportsPage = lazy(() => import('./pages/Reports').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-label="Yükleniyor" />
    </div>
  );
}

function ThemedApp() {
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Açık Rotalar */}
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
            />

            {/* Korumalı Rotalar (Yetkilendirme Zorunlu) */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/transactions" element={<TransactionsPage />} />
                      <Route path="/installments" element={<InstallmentsPage />} />
                      <Route path="/recurring" element={<RecurringPage />} />
                      <Route path="/budgets" element={<BudgetsPage />} />
                      <Route path="/goals" element={<GoalsPage />} />
                      <Route path="/reminders" element={<RemindersView />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route
                        path="*"
                        element={
                          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                            <div className="text-6xl font-bold text-brand-500">404</div>
                            <p className="mt-2 text-sm text-slate-500">Aradığınız sayfa mevcut değil</p>
                            <a href="/" className="mt-3 text-sm font-semibold text-brand-600 hover:underline">
                              Ana sayfaya dön
                            </a>
                          </div>
                        }
                      />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemedApp />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

