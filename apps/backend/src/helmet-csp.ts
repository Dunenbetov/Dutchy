import helmet from 'helmet';
import { isMonolithDeploy } from './static-dir';

/** CSP for monolith: allow Google Fonts + same-origin SPA assets. */
export function helmetOptions(): Parameters<typeof helmet>[0] {
  const base: Parameters<typeof helmet>[0] = {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  };

  if (!isMonolithDeploy()) {
    return base;
  }

  return {
    ...base,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'connect-src': [
          "'self'",
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
        ],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'font-src': ["'self'", 'https:', 'data:'],
      },
    },
  };
}
