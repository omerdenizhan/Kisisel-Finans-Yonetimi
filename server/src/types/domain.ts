// Domain tipleri — istemci ile paylaşılabilir.

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
  description: string | null;
  notes: string | null;
  date: string;
  installment_id: number | null;
  recurring_id: number | null;
  created_at: string;
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
}

export interface Budget {
  id: number;
  category_id: number;
  amount: number;
  month: string;
  notes: string | null;
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

export interface Setting {
  key: string;
  value: string;
}
