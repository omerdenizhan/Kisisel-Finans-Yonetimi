import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { api } from './client';
import type {
  Category, Transaction, TransactionsResponse, DashboardSummary, TxnType,
  Installment, RecurringTransaction, Budget, Goal, Reminder,
} from '../types';

// ---------- Categories ----------
export function useCategories(type?: TxnType) {
  return useQuery<Category[]>({
    queryKey: ['categories', type ?? 'all'],
    queryFn: async () => {
      const data = await api<{ items: Category[] }>(`/categories${type ? `?type=${type}` : ''}`);
      return data.items;
    },
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; type: TxnType; color?: string; icon?: string }) =>
      api<Category>('/categories', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<Omit<Category, 'id'>>) =>
      api<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ deleted?: boolean; archived?: boolean }>(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------- Transactions ----------
export interface TxnFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: number;
  type?: TxnType;
  q?: string;
  min?: number;
  max?: number;
  limit?: number;
  offset?: number;
}

function toQuery(f: TxnFilters): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== '' && v !== null) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function useTransactions(filters: TxnFilters, options?: Partial<UseQueryOptions<TransactionsResponse>>) {
  return useQuery<TransactionsResponse>({
    queryKey: ['transactions', filters],
    queryFn: () => api<TransactionsResponse>(`/transactions${toQuery(filters)}`),
    ...options,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: TxnType;
      amount: number;
      category_id: number | null;
      description: string | null;
      notes: string | null;
      date: string;
      installment_id?: number | null;
      recurring_id?: number | null;
    }) =>
      api<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<Transaction> & { id: number }) =>
      api<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<{ id: number }>(`/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

// ---------- Dashboard ----------
export function useDashboard(month?: string) {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', month ?? 'current'],
    queryFn: () => api<DashboardSummary>(`/dashboard${month ? `?month=${month}` : ''}`),
  });
}

// ---------- Installments ----------
export function useInstallments() {
  return useQuery<Installment[]>({
    queryKey: ['installments'],
    queryFn: async () => (await api<{ items: Installment[] }>('/installments')).items,
  });
}

export function useInstallment(id: number | null) {
  return useQuery<Installment>({
    queryKey: ['installment', id],
    queryFn: () => api<Installment>(`/installments/${id}`),
    enabled: id != null,
  });
}

export function useCreateInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      total_amount: number;
      installment_count: number;
      start_date: string;
      category_id?: number | null;
      notes?: string | null;
    }) => api<Installment>('/installments', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<{ id: number }>(`/installments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function usePayInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId, date }: { id: number; paymentId: number; date?: string }) =>
      api<{ transaction_id: number; payment_id: number }>(`/installments/${id}/pay/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify(date ? { date } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installments'] });
      qc.invalidateQueries({ queryKey: ['installment'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUnpayInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: number; paymentId: number }) =>
      api(`/installments/${id}/unpay/${paymentId}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installments'] });
      qc.invalidateQueries({ queryKey: ['installment'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

// ---------- Recurring ----------
export function useRecurring() {
  return useQuery<RecurringTransaction[]>({
    queryKey: ['recurring'],
    queryFn: async () => (await api<{ items: RecurringTransaction[] }>('/recurring')).items,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: TxnType;
      amount: number;
      category_id: number | null;
      description?: string | null;
      notes?: string | null;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      start_date: string;
      end_date?: string | null;
    }) => api<RecurringTransaction>('/recurring', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/recurring/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useRunRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ generated: number }>('/recurring/run', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------- Budgets ----------
export function useBudgets(month?: string) {
  return useQuery<Budget[]>({
    queryKey: ['budgets', month ?? 'all'],
    queryFn: async () =>
      (await api<{ items: Budget[] }>(`/budgets${month ? `?month=${month}` : ''}`)).items,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { category_id: number; amount: number; month: string; notes?: string | null }) =>
      api<Budget>('/budgets', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

// ---------- Goals ----------
export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => (await api<{ items: Goal[] }>('/goals')).items,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      target_amount: number;
      current_amount?: number;
      target_date?: string | null;
      notes?: string | null;
    }) => api<Goal>('/goals', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta, set }: { id: number; delta?: number; set?: number }) =>
      api<Goal>(`/goals/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ delta, set }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// ---------- Reports ----------
export interface MonthlyReport {
  year: number;
  month: number;
  month_str: string;
  income: number;
  expense: number;
  net: number;
  transaction_count: number;
  category_breakdown: Array<{
    category_id: number | null;
    name: string;
    color: string | null;
    type: 'income' | 'expense';
    total: number;
    count: number;
    percentage: number;
  }>;
  top_expenses: Array<{ id: number; amount: number; description: string | null; date: string; category_name: string | null; category_color: string | null }>;
  daily_trend: Array<{ date: string; income: number; expense: number; net: number }>;
  comparison_prev_month: { income_pct: number; expense_pct: number; net_pct: number };
}

export interface YearlyReport {
  year: number;
  total_income: number;
  total_expense: number;
  total_net: number;
  transaction_count: number;
  months: Array<{ month: string; income: number; expense: number; net: number }>;
  category_breakdown: Array<{ category_id: number | null; name: string; color: string | null; type: 'income' | 'expense'; total: number; percentage: number }>;
  growth: { income_yoy: number; expense_yoy: number; net_yoy: number };
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery<MonthlyReport>({
    queryKey: ['report', 'monthly', year, month],
    queryFn: () => api<MonthlyReport>(`/reports/monthly?year=${year}&month=${month}`),
  });
}

export function useYearlyReport(year: number) {
  return useQuery<YearlyReport>({
    queryKey: ['report', 'yearly', year],
    queryFn: () => api<YearlyReport>(`/reports/yearly?year=${year}`),
  });
}
export function useReminders(params?: { includeDone?: boolean; upcomingDays?: number }) {
  return useQuery<Reminder[]>({
    queryKey: ['reminders', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.includeDone) sp.set('includeDone', 'true');
      if (params?.upcomingDays !== undefined) sp.set('upcomingDays', String(params.upcomingDays));
      const qs = sp.toString();
      return (await api<{ items: Reminder[] }>(`/reminders${qs ? `?${qs}` : ''}`)).items;
    },
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      due_date: string;
      amount?: number | null;
      type?: string | null;
      notes?: string | null;
    }) => api<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useToggleReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_done }: { id: number; is_done: boolean }) =>
      api<Reminder>(`/reminders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_done }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/reminders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}