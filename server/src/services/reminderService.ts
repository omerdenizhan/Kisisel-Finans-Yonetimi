import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { HttpError } from '../middleware/errorHandler.js';

export const reminderCreateSchema = z.object({
  title: z.string().min(1).max(120),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0).nullable().optional(),
  type: z.string().max(40).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const reminderUpdateSchema = reminderCreateSchema.partial().extend({
  is_done: z.boolean().optional(),
});

export type ReminderCreate = z.infer<typeof reminderCreateSchema>;
export type ReminderUpdate = z.infer<typeof reminderUpdateSchema>;

export function listReminders(filter?: { includeDone?: boolean; upcomingDays?: number }) {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (!filter?.includeDone) where.push('is_done = 0');
  if (filter?.upcomingDays !== undefined) {
    where.push(`due_date <= date('now', '+' || ? || ' days')`);
    params.push(filter.upcomingDays);
  }
  const sql = `SELECT * FROM reminders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY is_done ASC, due_date ASC`;
  return db.prepare(sql).all(...params);
}

export function getReminder(id: number) {
  const r = getDb().prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  if (!r) throw new HttpError(404, 'Hatırlatıcı bulunamadı');
  return r;
}

export function createReminder(input: ReminderCreate) {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO reminders (title, due_date, amount, type, notes)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.title, input.due_date, input.amount ?? null, input.type ?? null, input.notes ?? null);
  return getReminder(Number(r.lastInsertRowid));
}

export function updateReminder(id: number, input: ReminderUpdate) {
  const db = getDb();
  getReminder(id);
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const k of ['title', 'due_date', 'amount', 'type', 'notes'] as const) {
    if (input[k] !== undefined) {
      fields.push(`${k} = ?`);
      params.push(input[k] ?? null);
    }
  }
  if (input.is_done !== undefined) {
    fields.push('is_done = ?');
    params.push(input.is_done ? 1 : 0);
  }
  if (!fields.length) return getReminder(id);
  params.push(id);
  db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getReminder(id);
}

export function deleteReminder(id: number) {
  const r = getDb().prepare('DELETE FROM reminders WHERE id = ?').run(id);
  if (r.changes === 0) throw new HttpError(404, 'Hatırlatıcı bulunamadı');
  return { id };
}
