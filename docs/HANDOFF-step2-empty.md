# Handoff: Step 2 empty after receipt upload

## Bug report (user)

After uploading a receipt photo and clicking **Parse receipt** (step 1 → 2), **Review items** shows:

- No line items in the list
- Empty **Receipt total (₸)** field
- **Continue** disabled (greyed out)
- No visible error message (user says "nothing happens")

Screenshot: `assets/________________2026-05-17___00.59.30-4b13b96c-d4a5-4f1b-aaa9-f5c7a746b7d1.png`

## Project context

**Dutchy** PWA — monorepo at `/Users/diamond/Desktop/split-app` (git folder name unchanged)

| Path | Role |
|------|------|
| `apps/frontend` | Angular 20, signals, Tailwind, PWA |
| `apps/backend` | NestJS proxy → OpenAI `gpt-4o` vision |
| `packages/shared` | Types, `formatKzt`, quantity assignments, totals |

**Run locally:** `npm run dev` → http://localhost:4200 + API http://localhost:3000/api/health

**Env:** copy `apps/backend/.env.example` → `.env` and set `OPENAI_API_KEY` locally (never commit `.env`).  
**Frontend:** `apps/frontend/src/environments/environment.ts` → `useMockParse: false` (real OpenAI).

## Recent feature work (may relate to bug)

1. **Quantity-based assignment** (not 1/n ratio) — `AssignmentState` = `itemId → friendId → piece count`
2. **Service charge** only if `serviceCharge.present` on receipt (from LLM)
3. **Review totals gate** — `canProceed` step 2 requires `totalsMatch()` (items subtotal vs receipt total ±1 ₸)
4. **KZT** formatting via `formatKzt()` / `KztPipe`
5. **LLM** returns `{ currency, items, receiptTotal, serviceCharge }` + optional refinement pass
6. **Review UI** overflow fixes (`min-w-0`, grid layout)

## Parse flow (step 1 → 2)

```
AppShellComponent.next() → store.parseReceipt()
  → step=2, isParsing=true
  → ReceiptApiService.parseReceipt(file) → POST /api/receipt/parse (multipart)
  → applyParseResult(result) OR catch → items=[], parseError set
  → isParsing=false
```

**Key files:**

- `apps/frontend/src/app/core/receipt-flow.store.ts` — `parseReceipt()`, `applyParseResult()`, `canProceed`
- `apps/frontend/src/app/core/receipt-api.service.ts`
- `apps/frontend/src/app/features/wizard/step-review.component.ts`
- `apps/backend/src/receipt/openai.service.ts`
- `apps/backend/src/receipt/receipt.controller.ts`

## Likely root causes (investigate in order)

1. **API request fails** (backend not running, proxy broken, 401 OpenAI, 429 throttler, 413/400 file validation)
   - `catch` in `parseReceipt()` clears items; error UI may be hard to see (styling) or not rendered
   - Check browser Network: `POST /api/receipt/parse` status + body

2. **Response shape mismatch** — frontend expects `ParseReceiptResponse`:
   ```ts
   { currency: 'KZT', items: ReceiptItem[], receiptTotal: number, serviceCharge: { present, percent?, amount? } }
   ```
   Old backend or partial JSON → `items` undefined/empty → empty UI

3. **OpenAI returns empty `items`** or validation strips them in `openai.service.ts`

4. **`FileTypeValidator`** rejects compressed JPEG (`image/jpeg` should pass; verify mimetype)

5. **Stale dev server** — user may need restart after schema changes; port 4200 conflict with Playwright

6. **`canProceed` step 2** — even with items, Continue disabled until `totalsMatch()`; user screenshot shows **zero items**, so primary issue is empty parse result, not totals alone

## Reproduction steps

```bash
cd /Users/diamond/Desktop/split-app
# Ensure apps/backend/.env has OPENAI_API_KEY
npm run dev
# Open http://localhost:4200
# Add friend, upload receipt, click Parse receipt
```

**Quick isolate:**

- Set `useMockParse: true` in `environment.ts` → should hit `POST /api/receipt/parse/mock` and show 4 mock items
- If mock works but real fails → OpenAI/backend issue
- If mock also empty → frontend/state bug

```bash
curl -s http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/receipt/parse/mock
```

## Suggested fixes

1. **Error UX on step 2:** always show `parseError` prominently; log `err` in catch; show HTTP status from `HttpErrorResponse`
2. **Defensive `applyParseResult`:** validate `result?.items?.length`, fallback message
3. **Allow Continue with manual entry** when parse fails: show "Add item" prominently + optional skip parse
4. **Backend:** return structured 4xx JSON; ensure `normalizeResponse` never returns empty items silently
5. **Dev:** add loading timeout message if OpenAI >30s

## E2E note

Playwright uses `--configuration=e2e` (`environment.e2e.ts`, `useMockParse: true`).  
`reuseExistingServer: false` — conflicts if user already has `npm run dev` on 4200.

## Agents / docs

- `docs/agents/frontend.md`, `ui-ux.md`, `debugger.md`, `code-reviewer.md`
- Plan file exists but do not edit: `.cursor/plans/receipt_splitter_pwa_*.plan.md`

## Definition of done

- [ ] Upload real receipt → step 2 shows parsed items + receipt total
- [ ] Clear error if API fails (visible in UI + console)
- [ ] Continue enabled when items exist and totals match (or documented manual fix path)
- [ ] `npm run build` passes; e2e passes with e2e config (no port conflict)
