import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { HttpError } from '../middleware/errorHandler.js';

const txnType = z.enum(['income', 'expense']);

export const transactionCreateSchema = z.object({
  type: txnType,
  amount: z.number().positive(),
  category_id: z.number().int().positive().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  installment_id: z.number().int().positive().nullable().optional(),
  recurring_id: z.number().int().positive().nullable().optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const transactionQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  type: txnType.optional(),
  q: z.string().max(100).optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['date', 'amount', 'created_at']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;

export function listTransactions(q: TransactionQuery) {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (q.dateFrom) { where.push('t.date >= ?'); params.push(q.dateFrom); }
  if (q.dateTo)   { where.push('t.date <= ?'); params.push(q.dateTo); }
  if (q.categoryId) { where.push('t.category_id = ?'); params.push(q.categoryId); }
  if (q.type)    { where.push('t.type = ?'); params.push(q.type); }
  if (q.q)       { where.push('(t.description LIKE ? OR t.notes LIKE ?)'); params.push(`%${q.q}%`, `%${q.q}%`); }
  if (q.min !== undefined) { where.push('t.amount >= ?'); params.push(q.min); }
  if (q.max !== undefined) { where.push('t.amount <= ?'); params.push(q.max); }

  const sortCol = q.sort === 'amount' ? 't.amount' : q.sort === 'created_at' ? 't.created_at' : 't.date';
  const dir = q.order === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${sortCol} ${dir}, t.id ${dir}
    LIMIT ? OFFSET ?
  `;
  params.push(q.limit, q.offset);

  const rows = db.prepare(sql).all(...params) as any[];

  // Sayım
  const countSql = `SELECT COUNT(*) as c FROM transactions t ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  const total = (db.prepare(countSql).get(...params.slice(0, -2)) as { c: number }).c;

  // Toplamlar (filtreye göre)
  const sumSql = `SELECT
      COALESCE(SUM(CASE WHEN t.type='income'  THEN t.amount ELSE 0 END),0) as income,
      COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END),0) as expense
    FROM transactions t ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  const sums = db.prepare(sumSql).get(...params.slice(0, -2)) as { income: number; expense: number };

  return {
    items: rows,
    total,
    income: sums.income,
    expense: sums.expense,
    net: sums.income - sums.expense,
    limit: q.limit,
    offset: q.offset,
  };
}

export function getTransaction(id: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
    )
    .get(id);
  if (!row) throw new HttpError(404, 'İşlem bulunamadı');
  return row;
}

export function createTransaction(input: TransactionCreate) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO transactions
        (type, amount, category_id, description, notes, date, installment_id, recurring_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.type,
      input.amount,
      input.category_id ?? null,
      input.description ?? null,
      input.notes ?? null,
      input.date,
      input.installment_id ?? null,
      input.recurring_id ?? null,
    );
  return getTransaction(Number(result.lastInsertRowid));
}

export function updateTransaction(id: number, input: TransactionUpdate) {
  const db = getDb();
  getTransaction(id);
  const fields: string[] = [];
  const params: unknown[] = [];
  const map: Array<keyof TransactionCreate> = [
    'type', 'amount', 'category_id', 'description', 'notes', 'date', 'installment_id', 'recurring_id',
  ];
  for (const k of map) {
    if (input[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(input[k] ?? null);
    }
  }
  if (!fields.length) return getTransaction(id);
  params.push(id);
  db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getTransaction(id);
}

export function deleteTransaction(id: number) {
  const db = getDb();
  getTransaction(id);
  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return { id };
}
