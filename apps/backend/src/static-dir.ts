import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Directory with built Angular `index.html` (see repo root Dockerfile / STATIC_DIR). */
export function resolveStaticDir(): string | undefined {
  const raw = process.env.STATIC_DIR?.trim();
  if (!raw) return undefined;
  const dir = resolve(raw);
  return existsSync(dir) ? dir : undefined;
}

export function isMonolithDeploy(): boolean {
  return Boolean(resolveStaticDir());
}
