export type TxnType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: number;
  name: string;
  type: TxnType;
  color: string | null;
  icon: string | null;
  is_archived: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: TxnType;
  amount: number;
  category_id: number | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  description: string | null;
  notes: string | null;
  date: string;
  installment_id: number | null;
  recurring_id: number | null;
  created_at: string;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  income: number;
  expense: number;
  net: number;
  limit: number;
  offset: number;
}

export interface DashboardSummary {
  month: string;
  income: number;
  expense: number;
  net: number;
  total_income: number;
  total_expense: number;
  total_balance: number;
  upcoming_installments: {
    count: number;
    remaining_amount: number;
    next_due_date: string | null;
    next_amount: number | null;
  };
  upcoming_reminders: Array<{ id: number; title: string; due_date: string; amount: number | null }>;
  recent_transactions: Transaction[];
  charts: {
    monthly_trend: Array<{ month: string; income: number; expense: number; net: number }>;
    income_vs_expense: Array<{ month: string; income: number; expense: number }>;
    category_distribution: Array<{ name: string; value: number; color: string }>;
    cash_flow: Array<{ date: string; amount: number; type: TxnType }>;
  };
}

export interface InstallmentPayment {
  id: number;
  installment_id: number;
  sequence: number;
  due_date: string;
  amount: number;
  is_paid: number;
  paid_date: string | null;
  paid_transaction_id: number | null;
}

export interface Installment {
  id: number;
  name: string;
  total_amount: number;
  installment_count: number;
  installment_amount: number;
  start_date: string;
  category_id: number | null;
  notes: string | null;
  created_at: string;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  payment_count?: number;
  paid_count?: number;
  remaining_amount?: number;
  payments?: InstallmentPayment[];
}

export interface RecurringTransaction {
  id: number;
  type: TxnType;
  amount: number;
  category_id: number | null;
  description: string | null;
  notes: string | null;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  is_active: number;
  created_at: string;
  category_name?: string | null;
  category_color?: string | null;
}

export interface Budget {
  id: number;
  category_id: number;
  amount: number;
  month: string;
  notes: string | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  spent: number;
  remaining: number;
  usage: number;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  is_completed: number;
  created_at: string;
}

export interface Reminder {
  id: number;
  title: string;
  due_date: string;
  amount: number | null;
  type: string | null;
  is_done: number;
  notes: string | null;
  created_at: string;
}
