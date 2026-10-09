// Build sonrası SQL şema dosyalarını dist/ altına kopyalar.
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const SOURCES = [
  ['src/db/schema.sql', 'dist/db/schema.sql'],
  ['src/db/migrations', 'dist/db/migrations'], // opsiyonel
];

for (const [src, dst] of SOURCES) {
  const from = join(root, src);
  const to = join(root, dst);
  if (!existsSync(from)) {
    if (existsSync(join(root, 'src/db/migrations'))) {
      // Migrations dizini zaten yoksa sessizce geç
    }
    if (src === 'src/db/migrations') continue;
    console.error(`[copy-assets] kaynak yok: ${from}`);
    process.exitCode = 1;
    continue;
  }

  const st = statSync(from);
  if (st.isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const f of readdirSync(from)) {
      copyFileSync(join(from, f), join(to, f));
    }
  } else {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  console.log(`[copy-assets] ${src} → ${dst}`);
}
