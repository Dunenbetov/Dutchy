# Receipt Splitter PWA

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

Create **two services** from this repo ([monorepo guide](https://docs.railway.com/guides/deploying-a-monorepo)):

### API service

- **Root directory:** `apps/backend`
- **Build:** `npm install && npm run build -w @receipt-splitter/shared && npm run build`
- **Start:** `npm run start:prod`
- **Healthcheck:** `/api/health`
- **Variables:**
  - `OPENAI_API_KEY`
  - `NODE_ENV=production`
  - `CORS_ORIGIN=https://<your-web-service>.up.railway.app`

### Web service

- **Root directory:** `apps/frontend`
- **Build:** `npm install && npm run build -w @receipt-splitter/shared && node ../../scripts/generate-env.mjs && npm run build`
- **Variables (build time):**
  - `API_URL=https://<your-api-service>.up.railway.app`
- **Output:** serve `dist/frontend/browser` as static files (Railway static site or `npx serve`)

Set watch paths so `apps/backend/**` and `apps/frontend/**` rebuild independently.

## Project layout

```
apps/frontend   Angular PWA
apps/backend    NestJS API
packages/shared Shared types & totals logic
e2e/            Playwright tests
docs/agents/    Agent playbooks (ui-ux, frontend, etc.)
```
