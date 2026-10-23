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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { classifyAuthFailure, isAllowedPath, jwtExpiry, parseCookie } from './lib';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3003;
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_COOKIE = 'ritmo_token';

function backendHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (process.env.EXTERNAL_API_KEY) headers['X-Api-Key'] = process.env.EXTERNAL_API_KEY;
  if (process.env.API_KEY) headers['API-Key'] = process.env.API_KEY;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const readCookie = (req: Request, name: string) => parseCookie(req.headers.cookie, name);

function setSessionCookie(req: Request, res: Response, token: string, maxAge: number) {
  const secure = isProd && (req.secure || req.headers['x-forwarded-proto'] === 'https');
  res.cookie(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: maxAge * 1000 });
}

if (!process.env.EXTERNAL_API_KEY) {
  console.warn('[config] EXTERNAL_API_KEY is empty: most backend routes will reject requests. Set it in .env.local.');
}

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);

// Security headers. The CSP is production-only: the Vite dev server needs inline scripts
// and a websocket for HMR. Google Fonts is the only third-party origin the app uses.
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
          },
        }
      : false,
    hsts: isProd,
  })
);

// Brute-force protection for the only unauthenticated write endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { detail: 'Too many failed login attempts. Try again in a few minutes.' },
});

// ── Auth ────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, express.json(), async (req, res) => {
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

app.post('/api/auth/logout', (req, res) => {
  const token = readCookie(req, TOKEN_COOKIE);
  if (token) verifiedTokens.delete(token);
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ── Session check ───────────────────────────────────────────────
// A cookie that merely *exists* proves nothing: most backend routes only need the API key this
// proxy adds. So the JWT is confirmed with the backend, and a positive answer is remembered
// briefly (never past the token's own expiry) to avoid one extra call per request.
const SESSION_TTL_MS = 30_000;
const verifiedTokens = new Map<string, number>();

async function verifySession(token: string): Promise<'ok' | 'invalid' | 'unreachable'> {
  const now = Date.now();
  const cached = verifiedTokens.get(token);
  if (cached && cached > now) return 'ok';
  verifiedTokens.delete(token);
  try {
    const r = await fetch(`${BACKEND_URL}/auth/me`, { headers: backendHeaders(token) });
    if (r.status === 401 || r.status === 403) return 'invalid';
    if (!r.ok) return 'unreachable';
    const exp = jwtExpiry(token);
    const until = Math.min(now + SESSION_TTL_MS, exp ? exp * 1000 : Infinity);
    if (verifiedTokens.size > 500) verifiedTokens.clear();
    verifiedTokens.set(token, until);
    return 'ok';
  } catch {
    return 'unreachable';
  }
}

// ── Backend proxy ───────────────────────────────────────────────
app.all('/api/backend/*', express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const token = readCookie(req, TOKEN_COOKIE);
  if (!token) return res.status(401).json({ detail: 'Not authenticated' });

  const session = await verifySession(token);
  if (session === 'invalid') {
    res.clearCookie(TOKEN_COOKIE, { path: '/' });
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  if (session === 'unreachable') return res.status(502).json({ detail: 'Backend is unreachable' });

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

  const upstreamType = upstream.headers.get('content-type');
  const payload = Buffer.from(await upstream.arrayBuffer());

  // Credential problems are translated so a bad API key never logs the user out.
  if ([401, 422].includes(upstream.status) && upstreamType?.includes('json')) {
    let parsed: unknown;
    try { parsed = JSON.parse(payload.toString()); } catch { /* not JSON */ }
    const failure = classifyAuthFailure(upstream.status, parsed);
    if (failure) {
      if (failure.endSession) res.clearCookie(TOKEN_COOKIE, { path: '/' });
      else console.error('[proxy]', failure.detail, `(${req.method} /${backendPath})`);
      return res.status(failure.status).json({ detail: failure.detail });
    }
  }

  res.status(upstream.status);
  if (upstreamType) res.setHeader('Content-Type', upstreamType);
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) res.setHeader('Content-Disposition', disposition);
  if (upstream.status === 204) return res.end();
  res.end(payload);
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
