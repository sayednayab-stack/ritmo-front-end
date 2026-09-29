export const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
export const TOKEN_COOKIE = 'ritmo_token';

// Only these backend areas are reachable through the proxy. Webhooks,
// /auth/register, /auth/users etc. are deliberately not exposed to the browser.
const ALLOWED_PREFIXES = [
  'admin',
  'airports',
  'transport-config',
  'iway',
  'vendors',
  'fleet',
  'drivers',
  'partners',
  'hotels',
  'fleet_requests',
  'journeys',
  'auth/me',
];

export function isAllowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function backendHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  if (process.env.EXTERNAL_API_KEY) headers['X-Api-Key'] = process.env.EXTERNAL_API_KEY;
  if (process.env.API_KEY) headers['API-Key'] = process.env.API_KEY;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** exp (seconds since epoch) from a JWT, without verifying it. */
export function jwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}
