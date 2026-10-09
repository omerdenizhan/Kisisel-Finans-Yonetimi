import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { HttpError } from '../middleware/errorHandler.js';
import { addMonths, parseISO, format } from 'date-fns';

const txnType = z.enum(['income', 'expense']);

export const installmentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  total_amount: z.number().positive(),
  installment_count: z.number().int().positive().max(360),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category_id: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const installmentUpdateSchema = installmentCreateSchema.partial();

export type InstallmentCreate = z.infer<typeof installmentCreateSchema>;
export type InstallmentUpdate = z.infer<typeof installmentUpdateSchema>;

/**
 * Bir taksitli alım kaydı + N adet aylık ödeme planı oluşturur.
 * Kuruş yuvarlaması: floor ile her taksit eşit, artık ilk taksite eklenir.
 */
export function createInstallment(input: InstallmentCreate) {
  const db = getDb();
  const base = Math.floor((input.total_amount * 100) / input.installment_count) / 100;
  const remainder = Math.round((input.total_amount - base * input.installment_count) * 100) / 100;

  return db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO installments
          (name, total_amount, installment_count, installment_amount, start_date, category_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.name,
        input.total_amount,
        input.installment_count,
        base, // installment_amount (görüntü için; ödemeler amounts'unda farklılık olabilir)
        input.start_date,
        input.category_id ?? null,
        input.notes ?? null,
      );
    const installmentId = Number(result.lastInsertRowid);

    const insertPayment = db.prepare(
      `INSERT INTO installment_payments (installment_id, sequence, due_date, amount)
       VALUES (?, ?, ?, ?)`,
    );
    const start = parseISO(input.start_date);
    for (let i = 0; i < input.installment_count; i++) {
      const due = format(addMonths(start, i), 'yyyy-MM-dd');
      const amount = i === 0 ? base + remainder : base;
      insertPayment.run(installmentId, i + 1, due, amount);
    }
    return installmentId;
  })();
}

export function listInstallments() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT i.*,
              c.name as category_name, c.color as category_color, c.icon as category_icon,
              (SELECT COUNT(*) FROM installment_payments WHERE installment_id = i.id) as payment_count,
              (SELECT COUNT(*) FROM installment_payments WHERE installment_id = i.id AND is_paid = 1) as paid_count,
              (SELECT COALESCE(SUM(amount),0) FROM installment_payments WHERE installment_id = i.id AND is_paid = 0) as remaining_amount
       FROM installments i
       LEFT JOIN categories c ON c.id = i.category_id
       ORDER BY i.created_at DESC`,
    )
    .all();
  return rows;
}

export function getInstallment(id: number) {
  const db = getDb();
  const inst = db
    .prepare(
      `SELECT i.*, c.name as category_name, c.color as category_color
       FROM installments i LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.id = ?`,
    )
    .get(id) as any;
  if (!inst) throw new HttpError(404, 'Taksit bulunamadı');
  const payments = db
    .prepare(
      `SELECT * FROM installment_payments WHERE installment_id = ? ORDER BY sequence ASC`,
    )
    .all(id);
  return { ...inst, payments };
}

export function updateInstallment(id: number, input: InstallmentUpdate) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM installments WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Taksit bulunamadı');

  const fields: string[] = [];
  const params: unknown[] = [];
  for (const k of ['name', 'total_amount', 'installment_count', 'start_date', 'category_id', 'notes'] as const) {
    if (input[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(input[k] ?? null);
    }
  }
  if (!fields.length) return getInstallment(id);
  params.push(id);
  db.prepare(`UPDATE installments SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getInstallment(id);
}

export function deleteInstallment(id: number) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM installments WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Taksit bulunamadı');

  return db.transaction(() => {
    const paidTxnIds = db
      .prepare('SELECT paid_transaction_id FROM installment_payments WHERE installment_id = ? AND paid_transaction_id IS NOT NULL')
      .all(id) as Array<{ paid_transaction_id: number }>;
    for (const row of paidTxnIds) {
      db.prepare('DELETE FROM transactions WHERE id = ?').run(row.paid_transaction_id);
    }
    db.prepare('DELETE FROM installments WHERE id = ?').run(id);
    return { id };
  })();
}

/**
 * Bir taksit ödemesini gerçek bir transaction'a bağlar:
 *  - transactions tablosuna yazar
 *  - installment_payments.is_paid=1 ve paid_date + paid_transaction_id set eder
 */
export function payInstallment(
  installmentId: number,
  paymentId: number,
  date?: string,
  accountCategoryId?: number | null,
) {
  const db = getDb();
  const payment = db
    .prepare('SELECT * FROM installment_payments WHERE id = ? AND installment_id = ?')
    .get(paymentId, installmentId) as any;
  if (!payment) throw new HttpError(404, 'Taksit ödemesi bulunamadı');
  if (payment.is_paid) throw new HttpError(400, 'Bu taksit zaten ödenmiş');

  const inst = db
    .prepare('SELECT category_id, name FROM installments WHERE id = ?')
    .get(installmentId) as { category_id: number | null; name: string };
  const paidDate = date ?? payment.due_date;
  const catId = accountCategoryId ?? inst.category_id;

  return db.transaction(() => {
    const txRes = db
      .prepare(
        `INSERT INTO transactions
          (type, amount, category_id, description, notes, date, installment_id)
         VALUES ('expense', ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        payment.amount,
        catId,
        `${inst.name} - ${payment.sequence}. taksit`,
        null,
        paidDate,
        installmentId,
      );
    const txId = Number(txRes.lastInsertRowid);
    db
      .prepare(
        `UPDATE installment_payments
         SET is_paid = 1, paid_date = ?, paid_transaction_id = ?
         WHERE id = ?`,
      )
      .run(paidDate, txId, paymentId);
    return { transaction_id: txId, payment_id: paymentId };
  })();
}

export function unpayInstallment(installmentId: number, paymentId: number) {
  const db = getDb();
  const payment = db
    .prepare('SELECT * FROM installment_payments WHERE id = ? AND installment_id = ?')
    .get(paymentId, installmentId) as any;
  if (!payment) throw new HttpError(404, 'Taksit ödemesi bulunamadı');
  if (!payment.is_paid) throw new HttpError(400, 'Bu taksit zaten ödenmemiş');

  return db.transaction(() => {
    if (payment.paid_transaction_id) {
      db.prepare('DELETE FROM transactions WHERE id = ?').run(payment.paid_transaction_id);
    }
    db
      .prepare(
        `UPDATE installment_payments
         SET is_paid = 0, paid_date = NULL, paid_transaction_id = NULL
         WHERE id = ?`,
      )
      .run(paymentId);
    return { payment_id: paymentId };
  })();
}
