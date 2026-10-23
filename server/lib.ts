// Pure helpers for the BFF in index.ts (kept separate so they can be unit-tested).

// Only these backend areas are reachable through the proxy. Webhooks, /auth/register,
// /auth/users etc. are deliberately not exposed to the browser.
export const ALLOWED_PREFIXES = [
  'admin', 'airports', 'transport-config', 'iway', 'vendors', 'fleet', 'drivers',
  'partners', 'hotels', 'fleet_requests', 'journeys', 'auth/me',
];

export const isAllowedPath = (p: string) =>
  !p.split('/').includes('..') && ALLOWED_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

/** exp (seconds since epoch) from a JWT, without verifying it. */
export function jwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function parseCookie(header: string | undefined, name: string): string | undefined {
  for (const part of (header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export type UpstreamFailure = { status: number; detail: string; endSession: boolean };

/**
 * Decide how to surface a backend error that is about *credentials* rather than the
 * request itself. The backend uses 401 both for a bad/expired user JWT and for a wrong
 * API key, and 422 when the X-Api-Key header is missing. Only the first one means the
 * user's session is over; the others are a server misconfiguration and must not log the
 * user out (which is what made a bad EXTERNAL_API_KEY look like a broken login).
 */
export function classifyAuthFailure(status: number, body: unknown): UpstreamFailure | null {
  const detail = (body as any)?.detail;
  const text = typeof detail === 'string' ? detail : JSON.stringify(detail ?? '');

  // FastAPI's default 422 body is { detail: [{ loc: [...] }] }; this backend's own handler
  // (main.py) returns { detail: "Invalid request data.", errors: { "header.x-api-key": "..." } }.
  const errors = (body as any)?.errors;
  const missingKeyHeader =
    status === 422 &&
    ((Array.isArray(detail) && detail.some((d: any) => Array.isArray(d?.loc) && d.loc.includes('x-api-key'))) ||
      (errors && typeof errors === 'object' && Object.keys(errors).some((k) => /x-api-key/i.test(k))));
  if (missingKeyHeader) {
    return { status: 502, detail: 'The backend requires an API key. Set EXTERNAL_API_KEY in .env.local.', endSession: false };
  }
  if (status === 401 && /api[\s-]?key/i.test(text)) {
    return { status: 502, detail: 'The backend rejected the API key. Check EXTERNAL_API_KEY in .env.local.', endSession: false };
  }
  if (status === 401) return { status: 401, detail: typeof detail === 'string' ? detail : 'Not authenticated', endSession: true };
  return null;
}
