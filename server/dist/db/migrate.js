import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDb } from './connection.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export function runMigrations() {
    const db = getDb();
    const migrationsDir = join(__dirname, 'migrations');
    db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
    let migrationFiles = [];
    try {
        migrationFiles = readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort();
    }
    catch {
        return;
    }
    const applied = new Set(db
        .prepare('SELECT name FROM _migrations')
        .all()
        .map((row) => row.name));
    for (const file of migrationFiles) {
        if (applied.has(file))
            continue;
        const sql = readFileSync(join(migrationsDir, file), 'utf-8');
        db.transaction(() => {
            db.exec(sql);
            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        })();
        console.log(`[migrate] applied ${file}`);
    }
}
