import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'apps/frontend/dist/frontend/browser');
const dest = join(root, 'apps/backend/static');

if (!existsSync(join(src, 'index.html'))) {
  console.error(`[railway] Frontend build missing: ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`[railway] Copied SPA → ${dest}`);
