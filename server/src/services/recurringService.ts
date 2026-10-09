import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { addDays, addWeeks, addMonths, addYears, format, isAfter, parseISO } from 'date-fns';
import { HttpError } from '../middleware/errorHandler.js';

const txnType = z.enum(['income', 'expense']);
const freq = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const recurringCreateSchema = z.object({
  type: txnType,
  amount: z.number().positive(),
  category_id: z.number().int().positive().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  frequency: freq,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const recurringUpdateSchema = recurringCreateSchema.partial();

export type RecurringCreate = z.infer<typeof recurringCreateSchema>;
export type RecurringUpdate = z.infer<typeof recurringUpdateSchema>;

function nextDate(from: string, f: z.infer<typeof freq>): string {
  const d = parseISO(from);
  let nd: Date;
  switch (f) {
    case 'daily':   nd = addDays(d, 1); break;
    case 'weekly':  nd = addWeeks(d, 1); break;
    case 'monthly': nd = addMonths(d, 1); break;
    case 'yearly':  nd = addYears(d, 1); break;
  }
  return format(nd, 'yyyy-MM-dd');
}

export function createRecurring(input: RecurringCreate) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO recurring_transactions
        (type, amount, category_id, description, notes, frequency, start_date, end_date, next_run_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.type,
      input.amount,
      input.category_id ?? null,
      input.description ?? null,
      input.notes ?? null,
      input.frequency,
      input.start_date,
      input.end_date ?? null,
      input.start_date, // İlk çalıştırma tarihi başlangıçla aynı
      input.is_active === false ? 0 : 1,
    );
  return getRecurring(Number(result.lastInsertRowid));
}

export function listRecurring() {
  return getDb()
    .prepare(
      `SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM recurring_transactions r
       LEFT JOIN categories c ON c.id = r.category_id
       ORDER BY r.is_active DESC, r.next_run_date ASC`,
    )
    .all();
}

export function getRecurring(id: number) {
  const row = getDb()
    .prepare(
      `SELECT r.*, c.name as category_name, c.color as category_color
       FROM recurring_transactions r LEFT JOIN categories c ON c.id = r.category_id
       WHERE r.id = ?`,
    )
    .get(id);
  if (!row) throw new HttpError(404, 'Tekrarlayan işlem bulunamadı');
  return row;
}

export function updateRecurring(id: number, input: RecurringUpdate) {
  const db = getDb();
  getRecurring(id);
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const k of [
    'type', 'amount', 'category_id', 'description', 'notes',
    'frequency', 'start_date', 'end_date',
  ] as const) {
    if (input[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(input[k] ?? null);
    }
  }
  if (input.is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(input.is_active ? 1 : 0);
  }
  if (!fields.length) return getRecurring(id);
  params.push(id);
  db.prepare(`UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getRecurring(id);
}

export function deleteRecurring(id: number) {
  const db = getDb();
  getRecurring(id);
  db.prepare('DELETE FROM recurring_transactions WHERE id = ?').run(id);
  return { id };
}

export interface RecurringRunResult { generated: number; details: Array<{ id: number; transaction_id: number; amount: number }> }

/**
 * next_run_date <= bugün olan tüm aktif kayıtlar için transaction oluşturur
 * ve next_run_date'i ileri sarar. end_date geçmişse pasifleştirir.
 * Idempotent: aynı gün birden çok kez çalıştırmak güvenli (sadece kalanları işler).
 */
export function runRecurring(now: Date = new Date()): RecurringRunResult {
  const db = getDb();
  const today = format(now, 'yyyy-MM-dd');
  const items = db
    .prepare(
      `SELECT * FROM recurring_transactions
       WHERE is_active = 1 AND next_run_date <= ?`,
    )
    .all(today) as any[];

  let generated = 0;
  const details: RecurringRunResult['details'] = [];

  for (const r of items) {
    let nextRun = r.next_run_date as string;
    // end_date kontrolü
    if (r.end_date && isAfter(now, parseISO(r.end_date))) {
      db.prepare('UPDATE recurring_transactions SET is_active = 0 WHERE id = ?').run(r.id);
      continue;
    }
    db.transaction(() => {
      // next_run_date hedef tarihe kadar üret
      while (nextRun <= today) {
        // end_date'i aştıysa dur
        if (r.end_date && nextRun > r.end_date) break;
        const txRes = db
          .prepare(
            `INSERT INTO transactions
              (type, amount, category_id, description, notes, date, recurring_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            r.type,
            r.amount,
            r.category_id,
            r.description,
            r.notes,
            nextRun,
            r.id,
          );
        generated++;
        details.push({ id: r.id, transaction_id: Number(txRes.lastInsertRowid), amount: r.amount });
        nextRun = nextDate(nextRun, r.frequency);
      }
      db.prepare('UPDATE recurring_transactions SET next_run_date = ? WHERE id = ?').run(nextRun, r.id);
    })();
  }
  return { generated, details };
}
