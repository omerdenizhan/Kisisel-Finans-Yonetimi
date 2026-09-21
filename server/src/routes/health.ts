import { Router } from 'express';
import { getDb } from '../db/connection.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  try {
    const db = getDb();
    const ok = db.prepare('SELECT 1 as ok').get() as { ok: number };
    res.json({ ok: ok.ok === 1, time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});
