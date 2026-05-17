/** Public origin of the Angular app (web service), not the API host. */
export function resolveCorsOrigin(): string {
  const raw =
    process.env.CORS_ORIGIN?.trim() || process.env.FRONTEND_URL?.trim() || '';
  if (!raw) return '';

  const parts = raw.split(',').map((p) => normalizeOrigin(p.trim())).filter(Boolean);
  return parts.join(',');
}

function normalizeOrigin(value: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/+$/, '');
  }
  return `https://${value.replace(/\/+$/, '')}`;
}
