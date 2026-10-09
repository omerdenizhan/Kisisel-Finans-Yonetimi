import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migration runner: server/src/db/migrations/*.sql dosyalarını sırayla uygular.
 * Her migration bir kez uygulanır (_migrations tablosu ile takip).
 */
export function runMigrations(): void {
  const db = getDb();
  const migrationsDir = join(__dirname, 'migrations');

  // _migrations tablosunu oluştur (schema.sql'den sonra çağrılacağı için burada güvenli)
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // İlk kurulumda schema.sql'i uygula
  const schemaPath = join(__dirname, 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  // Eğer migrations/ dizini yoksa veya boşsa çık
  let migrationFiles: string[] = [];
  try {
    migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch {
    // migrations dizini yoksa sorun değil
    return;
  }

  const applied = new Set(
    db
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((row: any) => row.name as string),
  );

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    })();
    console.log(`[migrate] applied ${file}`);
  }
}
