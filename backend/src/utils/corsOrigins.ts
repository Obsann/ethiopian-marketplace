/** Primary SPA origin for redirects (mail, OAuth return, payment return). */
export function getFrontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * CORS allowlist for browser + Socket.io.
 * FRONTEND_URL is always included; CORS_ORIGINS may add comma-separated extras
 * (e.g. Vercel preview deployments).
 */
export function getCorsOrigins(): string | string[] {
  const primary = getFrontendUrl();
  const extras = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const all = [...new Set([primary, ...extras])];
  return all.length === 1 ? all[0]! : all;
}
