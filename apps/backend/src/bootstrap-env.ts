import { resolveCorsOrigin } from './cors-origin';
import { openAiKeyFromProcessEnv } from './runtime-env';

/** Fail fast with Railway-friendly diagnostics before Nest ConfigModule runs. */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing: string[] = [];
  const openai = openAiKeyFromProcessEnv();
  if (!openai) {
    missing.push('OPENAI_API_KEY');
  }
  if (!resolveCorsOrigin()) {
    missing.push('CORS_ORIGIN or FRONTEND_URL');
  }
  if (missing.length === 0) return;

  const railway = process.env.RAILWAY_ENVIRONMENT
    ? `Railway service "${process.env.RAILWAY_SERVICE_NAME ?? 'unknown'}"`
    : 'non-Railway host';

  const lines = [
    'Production startup blocked — required env vars missing from process.env:',
    ...missing.map((name) => `  • ${name}`),
    '',
    `Context: ${railway}`,
    `OPENAI_API_KEY defined: ${process.env.OPENAI_API_KEY !== undefined}, length: ${process.env.OPENAI_API_KEY?.length ?? 0}`,
    `CORS_ORIGIN defined: ${process.env.CORS_ORIGIN !== undefined}, length: ${process.env.CORS_ORIGIN?.length ?? 0}`,
    '',
    'If Variables look correct in the Railway UI:',
    '  1. Open Raw Editor — confirm values are non-empty (not just the variable name)',
    '  2. Variables must be on the API service that runs Nest (Root Directory: apps/backend)',
    '  3. Redeploy after saving variables (a restart alone is not always enough)',
    '  4. Push the latest code — older builds used a weaker env check',
  ];

  console.error(lines.join('\n'));
  throw new Error(`Missing production env: ${missing.join(', ')}`);
}
