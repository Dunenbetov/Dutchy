/** Public origin of the Angular app (web service), not the API host. */
export function resolveCorsOrigin(): string {
  const fromEnv =
    process.env.CORS_ORIGIN?.trim() || process.env.FRONTEND_URL?.trim() || '';
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((p) => normalizeOrigin(p.trim()))
      .filter(Boolean)
      .join(',');
  }

  // Monolith (API + SPA): same public host as the API service.
  if (process.env.STATIC_DIR?.trim() && process.env.RAILWAY_PUBLIC_DOMAIN?.trim()) {
    return normalizeOrigin(process.env.RAILWAY_PUBLIC_DOMAIN);
  }

  return '';
}

function normalizeOrigin(value: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/+$/, '');
  }
  return `https://${value.replace(/\/+$/, '')}`;
}
