# RITMO frontend

Next.js 14 + Tailwind admin console for `fa-ritmo-api`.

## Run

```bash
cp .env.example .env.local   # set BACKEND_URL, EXTERNAL_API_KEY (and API_KEY if the backend has one)
npm install
npm run dev                  # http://localhost:3001
```

Log in with a backend user (`POST /auth/login`). Don't run `next dev` and `next build`
at the same time; they share `.next` and corrupt each other.

## How auth works

- The browser never sees an API key. All calls go to `/api/backend/*`, a server-side proxy
  (`src/app/api/backend/[...path]/route.ts`) that adds `X-Api-Key` (`EXTERNAL_API_KEY`),
  `API-Key` (`API_KEY`, if set) and the user's JWT.
- `/api/auth/login` stores the JWT in an httpOnly cookie; `middleware.ts` redirects
  unauthenticated page loads to `/login`.
- The proxy only forwards an allow-list of backend prefixes (`src/lib/server/backend.ts`).
  Add a prefix there when the backend gains a new area.

## Pages

| Area | Pages | Backend |
|---|---|---|
| Operations | Dashboard, Bookings, Analytics, Schedulers | `/admin/*`, `/iway/schedulers/*` |
| Routing | Priority Rules, Vendors, Transport Config, Airports | `/admin/priority-rules`, `/vendors`, `/transport-config`, `/airports` |
| Fleet | Vehicles, Drivers, Partners, Hotels, Fleet Requests, Journeys | `/fleet`, `/drivers`, `/partners`, `/hotels`, `/fleet_requests`, `/journeys` |

Simple CRUD pages share `src/components/resource/ResourcePage.tsx`; add a page by giving it
an endpoint, field definitions and table columns.
