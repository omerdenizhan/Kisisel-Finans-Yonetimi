import { z } from 'zod';
import { getDb } from '../db/connection.js';
import { HttpError } from '../middleware/errorHandler.js';
export const goalCreateSchema = z.object({
    name: z.string().min(1).max(100),
    target_amount: z.number().positive(),
    current_amount: z.number().min(0).default(0),
    target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
});
export const goalUpdateSchema = goalCreateSchema.partial();
export const goalProgressSchema = z.object({
    delta: z.number(),
    set: z.number().min(0).optional(),
});
export function listGoals() {
    return getDb().prepare('SELECT * FROM goals ORDER BY is_completed, target_date').all();
}
export function getGoal(id) {
    const g = getDb().prepare('SELECT * FROM goals WHERE id = ?').get(id);
    if (!g)
        throw new HttpError(404, 'Hedef bulunamadı');
    return g;
}
export function createGoal(input) {
    const db = getDb();
    const r = db
        .prepare(`INSERT INTO goals (name, target_amount, current_amount, target_date, notes)
       VALUES (?, ?, ?, ?, ?)`)
        .run(input.name, input.target_amount, input.current_amount ?? 0, input.target_date ?? null, input.notes ?? null);
    return getGoal(Number(r.lastInsertRowid));
}
export function updateGoal(id, input) {
    const db = getDb();
    getGoal(id);
    const fields = [];
    const params = [];
    for (const k of ['name', 'target_amount', 'current_amount', 'target_date', 'notes']) {
        if (input[k] !== undefined) {
            fields.push(`${k} = ?`);
            params.push(input[k] ?? null);
        }
    }
    if (!fields.length)
        return getGoal(id);
    params.push(id);
    db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return getGoal(id);
}
export function deleteGoal(id) {
    const r = getDb().prepare('DELETE FROM goals WHERE id = ?').run(id);
    if (r.changes === 0)
        throw new HttpError(404, 'Hedef bulunamadı');
    return { id };
}
export function updateProgress(id, input) {
    const db = getDb();
    const g = getGoal(id);
    let next;
    if (input.set !== undefined)
        next = input.set;
    else
        next = Math.max(0, g.current_amount + input.delta);
    const isCompleted = next >= g.target_amount ? 1 : 0;
    db.prepare('UPDATE goals SET current_amount = ?, is_completed = ? WHERE id = ?').run(next, isCompleted, id);
    return getGoal(id);
}
