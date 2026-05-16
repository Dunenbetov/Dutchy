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
- **Variables:**
  - `NODE_ENV=production` (required)
  - `OPENAI_API_KEY` (required in production)
  - `CORS_ORIGIN=https://<your-web-host>`

### Web service

- **Root directory:** `apps/frontend` (uses `railway.toml` — `serve` on `$PORT`)
- **Variables (build time):**
  - `API_URL=https://<your-api-host>` (`/api` appended automatically if missing)

Set watch paths so `apps/backend/**` and `apps/frontend/**` rebuild independently.

## Project layout

```
apps/frontend   Angular PWA (Dutchy)
apps/backend    NestJS API
packages/shared Shared types & totals logic
e2e/            Playwright tests
docs/agents/    Agent playbooks (ui-ux, frontend, etc.)
```

Local clone folder can stay `split-app`; only Railway and product branding use **Dutchy**.
