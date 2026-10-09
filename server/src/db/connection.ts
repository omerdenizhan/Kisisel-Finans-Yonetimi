import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DB yolu: proje kökü/server/data/finance.db (veya DB_PATH env)
const DEFAULT_DB_PATH = resolve(__dirname, '../../data/finance.db');
const DB_PATH = process.env.DB_PATH
  ? resolve(process.cwd(), process.env.DB_PATH)
  : DEFAULT_DB_PATH;

const dataDir = dirname(DB_PATH);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

let _db: Database.Database | null = null;

/**
 * Tekil veritabanı bağlantısı. better-sqlite3 senkron çalışır,
 * eşzamanlılık sorunu yok — tek process yeterli.
 */
export function getDb(): Database.Database {
  if (_db) return _db;

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  _db = db;
  return db;
}

export function getDbPath(): string {
  return DB_PATH;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
