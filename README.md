# Dutchy

Mobile-first PWA to photograph a restaurant receipt, parse line items via OpenAI Vision (through a NestJS proxy), and split the bill among friends with a 10% service charge.

## Stack

- **Frontend:** Angular 20 (standalone, signals), Tailwind CSS v4, PWA
- **Backend:** NestJS gateway (`POST /api/receipt/parse`)
- **E2E:** Playwright (iPhone / Pixel profiles)
- **Deploy:** Railway (two services: API + static web)

## Quick start

```bash
cp .env.example apps/backend/.env
# Add OPENAI_API_KEY to apps/backend/.env (optional if using mock parse only)

npm install
npm run build:shared
npm run dev
```

- Web: http://localhost:4200
- API: http://localhost:3000/api/health

Use **mock parse** (no OpenAI spend) when `useMockParse: true` in `apps/frontend/src/environments/environment.ts` (default in dev).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + frontend concurrently |
| `npm run build` | Shared + backend + frontend |
| `npm run test:e2e` | Playwright mobile tests |

## Railway deployment

Create a Railway **project** named **Dutchy** and two services from this repo ([monorepo guide](https://docs.railway.com/guides/deploying-a-monorepo)). Use short service names so URLs stay compact (Railway adds environment suffixes), for example:

| Service | Root directory | Suggested name in Railway |
|---------|----------------|---------------------------|
| API | `apps/backend` | `api` |
| Web | `apps/frontend` | `web` |

Typical public URLs look like `dutchy-api-production.up.railway.app` and `dutchy-web-production.up.railway.app` (exact hostnames depend on your project/service names).

### API service

- **Root directory:** `apps/backend` (uses `railway.toml`)
- **Healthcheck:** `/api/health`
- **Variables** (Railway → API service → **Variables**):

| Variable | Example | Notes |
|----------|---------|--------|
| `NODE_ENV` | `production` | Railway often sets this automatically |
| `OPENAI_API_KEY` | `sk-...` | **Required** — app exits without it in production |
| `CORS_ORIGIN` | `https://dutchy-web-production.up.railway.app` | **Web** service public URL (not the API host) |
| `FRONTEND_URL` | (same as above) | Optional alias for `CORS_ORIGIN` |

Do **not** point `CORS_ORIGIN` at the API domain — browsers call the API from the **web** origin.

### Web service

- **Root directory:** `apps/frontend` (uses `railway.toml` — `serve` on `$PORT`)
- **Variables (build time):**

| Variable | Example | Notes |
|----------|---------|--------|
| `API_URL` | `https://dutchy-api-production.up.railway.app` | `/api` appended automatically if missing |

Redeploy **web** after changing `API_URL` (baked into `environment.prod.ts` at build time).

### Crash right after deploy (`OPENAI_API_KEY must be set`)

Logs show Nest starting, then an `OPENAI_API_KEY` / `ExceptionHandler` error even when Variables look set in the UI.

**Common causes:**

1. **Empty value** — Railway masks variables as `*******` even when empty. Open **Raw Editor** and confirm `OPENAI_API_KEY=sk-...` has a real value.
2. **No redeploy** — changing Variables requires **Redeploy** (not only Restart).
3. **Wrong service** — variables must be on the **API** service (`Root Directory: apps/backend`), not only the web service.
4. **Old build** — push the latest code; startup now reads `process.env` directly and logs `OPENAI_API_KEY defined: … length: …` when something is wrong.

**Fix:** API service → **Variables** → set `OPENAI_API_KEY`, `CORS_ORIGIN` (web URL), `NODE_ENV=production` → **Redeploy**.

### `Cannot GET /` or 404 on the public URL

The API only serves routes under `/api` (e.g. `/api/health`). Opening the API domain in a browser shows Nest’s `Cannot GET /` — that is expected.

| URL | What you get |
|-----|----------------|
| `https://<api-host>/` | JSON hint (after latest deploy) or 404 |
| `https://<api-host>/api/health` | `{"status":"ok"}` — use this to verify the API |

The **Angular UI** must be a **second** Railway service with Root Directory `apps/frontend`. Open the **web** service URL in the browser, not the API URL.

Set watch paths so `apps/backend/**` and `apps/frontend/**` rebuild independently.

### If build fails with «No start command could be found»

Your log shows `install: npm ci` + `build: npm run build` with an **empty start** — Railway is building the **repo root**, not `apps/backend`.

**API service (pick one):**

| Option | What to do |
|--------|------------|
| A (recommended) | **Settings → Root Directory:** `apps/backend` → Redeploy |
| B | Leave root empty; push latest code (root `nixpacks.toml` + `"start"` in `package.json`) → Redeploy |

**Web service:** Root Directory **must** be `apps/frontend`. Start command: `npm run start:prod`.

Manual override: **Settings → Deploy → Start Command** → `node dist/main.js` (api) or `npm run start:prod` (web).

## Project layout

```
apps/frontend   Angular PWA (Dutchy)
apps/backend    NestJS API
packages/shared Shared types & totals logic
e2e/            Playwright tests
docs/agents/    Agent playbooks (ui-ux, frontend, etc.)
```

Local clone folder can stay `split-app`; only Railway and product branding use **Dutchy**.
