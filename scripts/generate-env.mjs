import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiUrl = process.env.API_URL ?? '/api';
const out = join(__dirname, '../apps/frontend/src/environments/environment.prod.ts');

const content = `// Auto-generated at build time — do not edit manually
export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
  useMockParse: false,
};
`;

writeFileSync(out, content);
console.log(`Wrote environment.prod.ts with apiUrl=${apiUrl}`);
