// Tiny BFF for the React app. It does what the Next.js API routes + middleware did:
//  - holds EXTERNAL_API_KEY / API_KEY server-side (never shipped to the browser)
//  - keeps the login JWT in an httpOnly cookie
//  - proxies an allow-list of backend areas under /api/backend/*
//  - redirects page loads without a session to /login
// In dev it embeds Vite (HMR) on the same port; in production it serves dist/.
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3003;
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_COOKIE = 'ritmo_token';

// Only these backend areas are reachable through the proxy. Webhooks, /auth/register,
// /auth/users etc. are deliberately not exposed to the browser.
const ALLOWED_PREFIXES = [
  'admin', 'airports', 'transport-config', 'iway', 'vendors', 'fleet', 'drivers',
  'partners', 'hotels', 'fleet_requests', 'journeys', 'auth/me',
];
const isAllowedPath = (p: string) => ALLOWED_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

function backendHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (process.env.EXTERNAL_API_KEY) headers['X-Api-Key'] = process.env.EXTERNAL_API_KEY;
  if (process.env.API_KEY) headers['API-Key'] = process.env.API_KEY;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** exp (seconds since epoch) from a JWT, without verifying it. */
function jwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

function setSessionCookie(req: Request, res: Response, token: string, maxAge: number) {
  const secure = isProd && (req.secure || req.headers['x-forwarded-proto'] === 'https');
  res.cookie(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: maxAge * 1000 });
}

const app = express();
app.disable('x-powered-by');

// ── Auth ────────────────────────────────────────────────────────
app.post('/api/auth/login', express.json(), async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(422).json({ detail: 'Username and password are required' });
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...backendHeaders() },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return res.status(502).json({ detail: 'Backend is unreachable' });
  }

  const data: any = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data.access_token) {
    const status = upstream.status === 401 ? 401 : upstream.ok ? 502 : upstream.status;
    return res.status(status).json({ detail: typeof data.detail === 'string' ? data.detail : 'Login failed' });
  }

  const exp = jwtExpiry(data.access_token);
  const maxAge = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 0) : 60 * 60 * 8;
  setSessionCookie(req, res, data.access_token, maxAge);
  res.json({ ok: true });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ── Backend proxy ───────────────────────────────────────────────
app.all('/api/backend/*', express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const token = readCookie(req, TOKEN_COOKIE);
  if (!token) return res.status(401).json({ detail: 'Not authenticated' });

  const backendPath = (req.params as Record<string, string>)[0];
  if (!isAllowedPath(backendPath)) return res.status(404).json({ detail: 'Not found' });

  const headers = backendHeaders(token);
  const contentType = req.headers['content-type'];
  if (contentType) headers['Content-Type'] = contentType;

  const search = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  const hasBody = !['GET', 'HEAD'].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0;
  const body = hasBody ? req.body : undefined;

  // FastAPI redirects "/fleet" <-> "/fleet/" (307). fetch() cannot replay a request body
  // across a redirect, hence the manual loop. Each hop is rebuilt against BACKEND_URL so a
  // Location header can never send the API keys to another host.
  let url = `${BACKEND_URL}/${backendPath}${search}`;
  let upstream: globalThis.Response | undefined;
  try {
    for (let hop = 0; hop < 3; hop++) {
      upstream = await fetch(url, { method: req.method, headers, body, redirect: 'manual' });
      const location = upstream.headers.get('location');
      if (![307, 308].includes(upstream.status) || !location) break;
      const next = new URL(location, BACKEND_URL);
      url = `${BACKEND_URL}${next.pathname}${next.search}`;
    }
  } catch (err) {
    console.error('[proxy] backend request failed:', req.method, backendPath, err);
    return res.status(502).json({ detail: 'Backend is unreachable' });
  }
  if (!upstream) return res.status(502).json({ detail: 'Backend is unreachable' });

  res.status(upstream.status);
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) res.setHeader('Content-Type', upstreamType);
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) res.setHeader('Content-Disposition', disposition);

  // The backend rejecting our JWT means the session is over.
  if (upstream.status === 401) res.clearCookie(TOKEN_COOKIE, { path: '/' });

  if (upstream.status === 204) return res.end();
  res.end(Buffer.from(await upstream.arrayBuffer()));
});

app.use('/api', (_req, res) => res.status(404).json({ detail: 'Not found' }));

// ── Page gate (replaces Next middleware) ───────────────────────
// Only document navigations are gated; assets / HMR / source requests pass through.
app.use((req: Request, res: Response, next: NextFunction) => {
  const isPage = req.method === 'GET' && !path.extname(req.path) && (req.headers.accept || '').includes('text/html');
  if (!isPage) return next();

  const hasSession = !!readCookie(req, TOKEN_COOKIE);
  if (req.path === '/login') return hasSession ? res.redirect('/') : next();
  if (!hasSession) {
    const nextParam = req.path !== '/' ? `?next=${encodeURIComponent(req.originalUrl)}` : '';
    return res.redirect(`/login${nextParam}`);
  }
  next();
});

// ── SPA ─────────────────────────────────────────────────────────
if (isProd) {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`RITMO console on http://localhost:${PORT}  (backend: ${BACKEND_URL}, ${isProd ? 'production' : 'dev'})`);
});
