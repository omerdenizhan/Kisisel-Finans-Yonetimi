import { Router } from 'express';
import { z } from 'zod';
import { readFileSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, basename, extname, resolve } from 'node:path';
import { getDbPath, closeDb, getDb } from '../db/connection.js';

export const settingsRouter = Router();

const settingUpdate = z.object({
  key: z.string().min(1).max(60),
  value: z.string(),
});

settingsRouter.get('/', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM settings').all();
  res.json({ items: rows });
});

settingsRouter.patch('/', (req, res) => {
  const parsed = settingUpdate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Geçersiz', issues: parsed.error.issues });
  const { key, value } = parsed.data;
  getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
  res.json({ key, value });
});

// DB yedek indir
settingsRouter.get('/backup', (_req, res) => {
  const dbPath = getDbPath();
  if (!existsSync(dbPath)) {
    return res.status(404).json({ error: 'Veritabanı bulunamadı' });
  }
  // WAL checkpoint — yedek tutarlı olsun
  try {
    getDb().pragma('wal_checkpoint(TRUNCATE)');
  } catch { /* yoksay */ }
  const filename = `yerel-finance-backup-${new Date().toISOString().slice(0, 10)}.db`;
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.sendFile(resolve(dbPath));
});

// DB geri yükle — body'de base64 veya multipart yerine doğrudan binary kabul ediyoruz
settingsRouter.post('/restore', (req, res) => {
  const dbPath = getDbPath();
  if (!existsSync(dbPath)) {
    return res.status(404).json({ error: 'Veritabanı yolu bulunamadı' });
  }
  // raw body buffer olarak gelecek (Content-Type: application/octet-stream)
  const buf = req.body as Buffer;
  if (!Buffer.isBuffer(buf) || buf.length < 100) {
    return res.status(400).json({ error: 'Geçersiz yedek dosyası (çok küçük)' });
  }
  // SQLite imza kontrolü: "SQLite format 3\x00"
  if (!buf.slice(0, 16).toString('utf-8').startsWith('SQLite format 3')) {
    return res.status(400).json({ error: 'Geçersiz SQLite dosyası' });
  }
  // Mevcut bağlantıyı kapat, dosyayı değiştir
  closeDb();
  const tmpPath = `${dbPath}.restore.tmp`;
  const backupPath = `${dbPath}.bak-${Date.now()}`;
  try {
    // Önce mevcut DB'yi yedekle
    if (existsSync(dbPath)) copyFileSync(dbPath, backupPath);
    // Geçici dosyaya yaz, sonra atomik rename
    require('node:fs').writeFileSync(tmpPath, buf);
    require('node:fs').renameSync(tmpPath, dbPath);
    res.json({ restored: true, previous_backup: basename(backupPath) });
  } catch (e: any) {
    res.status(500).json({ error: 'Geri yükleme hatası', message: String(e) });
  }
});
