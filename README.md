# RITMO frontend (React)

React 18 + Vite + React Router + Tailwind admin console for `fa-ritmo-api`, ported from the
Next.js version in `../ritmo-front-end`. Same UI and pages.

## Run

```bash
cp .env.example .env.local   # BACKEND_URL, EXTERNAL_API_KEY (must match the backend), API_KEY optional
npm install
npm run dev                  # http://localhost:3003  (Express + Vite HMR, one port)
```

Production: `npm run build && npm start` (Express serves `dist/` and the API proxy).

## Why there is a small Express server

A browser-only app cannot keep a secret. `server/index.ts` does what the Next.js API routes did:

- `/api/auth/login` exchanges credentials with the backend and stores the JWT in an httpOnly cookie.
- `/api/backend/*` proxies an allow-list of backend areas, adding `X-Api-Key` (`EXTERNAL_API_KEY`),
  `API-Key` (`API_KEY`, if set) and the user's JWT. The browser never sees the keys.
- Page loads without a session cookie are redirected to `/login`.

Add a backend area to `ALLOWED_PREFIXES` in `server/index.ts` when the backend gains one.

## Layout

`src/pages/*` (one per route, wired in `src/App.tsx`), `src/components/*`, `src/lib/api.ts`.
