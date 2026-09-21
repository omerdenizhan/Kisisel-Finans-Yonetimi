import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { HttpError } from '../middleware/errorHandler.js';

const txnType = z.enum(['income', 'expense']);

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(60),
  type: txnType,
  color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().nullable(),
  icon: z.string().max(40).optional().nullable(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  is_archived: z.boolean().optional(),
});

export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

export function listCategories(filter?: { type?: 'income' | 'expense'; includeArchived?: boolean }) {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.type) {
    where.push('type = ?');
    params.push(filter.type);
  }
  if (!filter?.includeArchived) {
    where.push('is_archived = 0');
  }
  const sql =
    'SELECT * FROM categories' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY type, name';
  return db.prepare(sql).all(...params);
}

export function createCategory(input: CategoryCreate) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO categories (name, type, color, icon)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.name, input.type, input.color ?? null, input.icon ?? null);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
}

export function updateCategory(id: number, input: CategoryUpdate) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Kategori bulunamadı');

  const fields: string[] = [];
  const params: unknown[] = [];
  if (input.name !== undefined) { fields.push('name = ?'); params.push(input.name); }
  if (input.type !== undefined) { fields.push('type = ?'); params.push(input.type); }
  if (input.color !== undefined) { fields.push('color = ?'); params.push(input.color); }
  if (input.icon !== undefined) { fields.push('icon = ?'); params.push(input.icon); }
  if (input.is_archived !== undefined) { fields.push('is_archived = ?'); params.push(input.is_archived ? 1 : 0); }
  if (!fields.length) return existing;

  params.push(id);
  db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function deleteCategory(id: number) {
  const db = getDb();
  const txCount = db
    .prepare('SELECT COUNT(*) as c FROM transactions WHERE category_id = ?')
    .get(id) as { c: number };
  if (txCount.c > 0) {
    // Silmek yerine arşivle — veri bütünlüğü
    db.prepare('UPDATE categories SET is_archived = 1 WHERE id = ?').run(id);
    return { archived: true, transactions: txCount.c };
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return { deleted: true };
}
