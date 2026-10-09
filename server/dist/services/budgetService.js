import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { HttpError } from '../middleware/errorHandler.js';
export const budgetCreateSchema = z.object({
    category_id: z.number().int().positive(),
    amount: z.number().positive(),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    notes: z.string().max(500).nullable().optional(),
});
export const budgetUpdateSchema = budgetCreateSchema.partial();
export function listBudgets(month) {
    const db = getDb();
    const where = [];
    const params = [];
    if (month) {
        where.push('b.month = ?');
        params.push(month);
    }
    const sql = `
    SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM budgets b
    LEFT JOIN categories c ON c.id = b.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY b.month DESC, c.name ASC
  `;
    const rows = db.prepare(sql).all(...params);
    // Her bütçe için o ayki harcamayı hesapla
    const fromTo = (m) => {
        const [y, mo] = m.split('-').map(Number);
        const start = new Date(y, mo - 1, 1);
        const end = new Date(y, mo, 0);
        const fmt = (d) => d.toISOString().slice(0, 10);
        return [fmt(start), fmt(end)];
    };
    return rows.map((b) => {
        const [from, to] = fromTo(b.month);
        const spent = db
            .prepare(`SELECT COALESCE(SUM(amount), 0) as s
         FROM transactions
         WHERE type = 'expense' AND category_id = ? AND date BETWEEN ? AND ?`)
            .get(b.category_id, from, to).s;
        return {
            ...b,
            spent,
            remaining: Math.max(0, b.amount - spent),
            usage: b.amount > 0 ? Math.min(1, spent / b.amount) : 0,
        };
    });
}
export function createBudget(input) {
    const db = getDb();
    try {
        const r = db
            .prepare(`INSERT INTO budgets (category_id, amount, month, notes)
         VALUES (?, ?, ?, ?)`)
            .run(input.category_id, input.amount, input.month, input.notes ?? null);
        return db.prepare('SELECT * FROM budgets WHERE id = ?').get(r.lastInsertRowid);
    }
    catch (e) {
        if (String(e).includes('UNIQUE')) {
            throw new HttpError(409, 'Bu kategori için bu ay zaten bütçe var');
        }
        throw e;
    }
}
export function updateBudget(id, input) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    if (!existing)
        throw new HttpError(404, 'Bütçe bulunamadı');
    const fields = [];
    const params = [];
    for (const k of ['category_id', 'amount', 'month', 'notes']) {
        if (input[k] !== undefined) {
            fields.push(`${k} = ?`);
            params.push(input[k] ?? null);
        }
    }
    if (!fields.length)
        return existing;
    params.push(id);
    db.prepare(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
}
export function deleteBudget(id) {
    const db = getDb();
    const r = db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    if (r.changes === 0)
        throw new HttpError(404, 'Bütçe bulunamadı');
    return { id };
}
