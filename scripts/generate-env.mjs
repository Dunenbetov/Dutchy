import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Ensure production builds call the API with /api prefix. */
function normalizeApiUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '/api') {
    return '/api';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const withoutTrailing = trimmed.replace(/\/+$/, '');
    return withoutTrailing.endsWith('/api')
      ? withoutTrailing
      : `${withoutTrailing}/api`;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const apiUrl = normalizeApiUrl(process.env.API_URL ?? '/api');
const out = join(__dirname, '../apps/frontend/src/environments/environment.prod.ts');

if (
  process.env.NODE_ENV === 'production' &&
  (apiUrl === '/api' || !apiUrl.startsWith('http'))
) {
  console.warn(
    'Warning: API_URL is not set to a full URL. Set API_URL=https://<api-host>/api for Railway web builds.',
  );
}

const content = `// Auto-generated at build time — do not edit manually
export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
  useMockParse: false,
};
`;

writeFileSync(out, content);
console.log(`Wrote environment.prod.ts with apiUrl=${apiUrl}`);
