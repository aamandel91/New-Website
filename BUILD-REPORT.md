# Build Report: Repliers Webhooks → SureSend Direct Integration

Repo: `aamandel91/New-Website` (Florida Home Finder monorepo — Next.js frontend at root, Koa/TypeScript backend in `backend/`).
Branch: `claude/repliers-suresend-webhooks-f1o6io`.

This repo is **multi-tenant by environment variable** (`APP_TENANT` backend / `NEXT_PUBLIC_TENANT` frontend: `floridahomefinder` default, `countryclub`). All listing links are built from the active tenant's `brand.siteUrl` (`backend/src/config/tenants/*.ts`), so the same code serves `floridahomefinder.com` and `sflcountryclubhomes.com` — no second-repo pass was needed for URL handling.

## What was built (file by file)

### SureSend client (Task 1)
- `backend/src/services/suresend/client.ts` — `SureSendService` (tsyringe injectable): Bearer auth from `SURESEND_API_TOKEN`, 429 retry honoring `Retry-After` (max 5 attempts), 5xx exponential backoff (max 3 attempts, 500ms base), all brief-listed methods (`createPerson`, `updatePerson` with `mergeTags`/`mergeEmails`/`mergePhones` query flags, `findPeople`, `applyTags`, `removeTags`, `createEvent`, `createNote`, `createTask`, `createAppointment`, `sendText`/`logText`, `sendEmail`/`logEmail`, `listGroups`, `listUsers`, `getIdentity`, `createCustomField`, `listCustomFields`, `createWebhook`, `listWebhooks`, `testWebhook`), plus `verifyConnection()` (GET /identity, logs team name, returns null on failure). `fetchFn`/`sleepFn` are swappable for tests.
- `backend/src/services/suresend/types.ts` — request/response types (mirrors the existing frontend `src/services/suresend/types.ts`, extended).

### Database (Task 2)
- `backend/src/migrations/20260803000000_suresend_integration.ts` — creates `suresend_person_map`, `processed_webhook_events`, `pending_alerts`, `webhook_secrets`, `portal_favorites`, `listing_status_log` (details under "New tables"). Runs via `npm run knex migrate:latest`; verified against a scratch Postgres 16.
- `backend/src/repository/suresendIntegration.ts` — `SureSendIntegrationRepository` with knex table typings and all data access (dedupe insert-on-conflict, person map upsert, pending alerts, webhook secrets, favorites/fans, status log, health counts).

### Job queue (Task 3)
- `backend/package.json` — added `pg-boss` (v12).
- `backend/src/providers/pgboss.ts` — `'pgboss'` DI token; builds the instance from the existing knex connection settings (**this repo has no `DATABASE_URL`** — DB config is `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`; the brief's "use the existing DATABASE_URL" was adapted to the repo's actual config). pg-boss owns its `pgboss` schema outside knex, per the brief's exception.
- `backend/src/jobs/queues.ts` — queue name constants: 17 `repliers.<event>` queues, 3 `suresend.<event>` queues, `suresend.unknown`, `suresend.activity`, `notify.slack`, `dead-letter`.
- `backend/src/jobs/index.ts` — `startJobQueue()`: starts pg-boss inside the server process, creates every queue with `retryLimit: 3, retryBackoff: true, deadLetter: 'dead-letter'`, registers one worker per event family, and logs a warning for every dead-letter arrival. Degrades gracefully (log, not crash) if Postgres is unavailable or `APP_DISABLE_PERSISTENCE=true`. Also exports `queueDepths()` for the health route.
- `backend/src/index.ts` — boots the queue at server start (after the existing FUB webhook install).

### Repliers webhook receivers (Task 4)
- `backend/src/routes/webhooks/repliersEvents.ts` — one POST route per event, kebab-case, mounted at **`/api/webhooks/repliers/<event>`** (the repo mounts every router under a global `/api` prefix; the brief's `/webhooks/repliers/…` paths gain that prefix — the subscription script accounts for it). Each route: (1) handshake — `X-Hook-Secret` + empty body → persist to `webhook_secrets`, echo header, 200; (2) delivery auth — constant-time compare of `x-api-key` against the stored secret, 401 on mismatch; (3) enqueue `repliers.<event>` and return 200 immediately. No processing in handlers.
- The pre-existing single-route receiver (`backend/src/routes/webhooks/repliers.ts`, POST `/api/webhooks/repliers`) and its `repliers_webhooks`/`repliers_webhook_events` tables were left untouched.

### SureSend inbound receiver (Task 5)
- `backend/src/routes/webhooks/suresend.ts` — `POST /api/webhooks/suresend`. Verifies `X-Webhook-Signature` as HMAC-SHA256 of the raw body with `SURESEND_WEBHOOK_SECRET` (timing-safe; fails closed if the secret is unset). Raw body already available repo-wide — koa-body runs with `includeUnparsed: true` (same access pattern as the FUB webhook auth). Dedupes on payload `eventId` via `processed_webhook_events`, enqueues `suresend.<event>`, returns 200 fast.

### Workers (Task 6) — `backend/src/jobs/workers/`
Every worker dedupes first (listing events on `mlsNumber + updatedOn`, others on natural IDs, hash fallback), resolves the SureSend person via the mapping table, then acts.
- `repliersClient.ts` — client-created/updated/deleted: createPerson with source `"<Tenant> Portal"` + `portal-registration` tag, mapping saved; updates via PUT with all three merge flags; deletes leave a note + `portal-account-deleted` tag.
- `repliersFavorite.ts` — favorite-created: local `portal_favorites` log, `property_view` event with full property payload + `metadata: {action: 'favorited'}`, tags `portal-favorite` + `community-<slug>`; 3+ favorites in 30 min → `hot-shopping-now` tag + call task due now. favorite-deleted: `removed_at`, note, `portal-cooling` when count hits zero.
- `repliersSearch.ts` — search-created/updated: `Property Search` event (city, state FL, min/max price, minBedrooms, searchUrl) with `metadata: {saved: true}`, tags `portal-saved-search` + price band; update notes the criteria diff and opens a requalification call task on a 15%+ maxPrice jump. search-deleted: note + `portal-cooling` unless another search was created the same day.
- `repliersSearchMatch.ts` — match alert text + email (photo, price, address, link) through the `SEND_LEAD_ALERTS` gate; note always written.
- `repliersListing.ts` — listing-updated branches on `previous`: price drop / Active→Pending / Pending→Active / →Sold fan out to local favorites with flag-gated texts plus always-live call tasks (due +2h) and notes; →Expired/Withdrawn/Terminated go to `listing_status_log` only (no lead-facing action). listing-deleted removes local favorites and notes affected fans. **Note:** this repo has no local listings store (listings are served live from the Repliers API; the existing "sync" service is FUB-people sync), so listing-created is dedupe+log only.
- `repliersMessage.ts` — note on the contact with the message body + `notify.slack` job.
- `repliersAgent.ts` — agent events are deduped and logged only; roster data always comes from live `GET /groups` / `GET /users` (never cached or hardcoded).
- `suresendPeople.ts` — peopleUpdated/peopleStageUpdated/peopleTagsAdded: refresh `suresend_person_map` and log. Minimal by design.
- `suresendActivity.ts` — processes fire-and-forget portal activity jobs (Task 7).
- `notifySlack.ts` — plain webhook POST to `SLACK_WEBHOOK_URL`; logs and skips when unset.
- Shared libs: `backend/src/jobs/lib/portal.ts` (tenant key/source/urls/price bands/slugs), `payload.ts` (tolerant Repliers payload extractors — see Assumptions), `personMap.ts` (find-or-create person + mapping), `alerts.ts` (`LeadAlertService`, the single `SEND_LEAD_ALERTS` gate).

### Server-side activity events (Task 7)
- `backend/src/services/suresendActivity.ts` — fire-and-forget enqueue onto `suresend.activity`; never throws, never blocks a render, skips unidentified visitors.
- `backend/src/routes/listings.ts` — `GET /api/listings/:mlsNumber` trailing middleware now also emits a SureSend `property_view` (full property payload) for identified non-agent users; both `/api/listings/search` routes emit `Property Search` (no `saved` flag) after responding.
- `backend/src/routes/contact.ts` — contact-us, showing/tour request, estimate-meeting, request-info handlers emit `form_submission` with `formName` + all scalar submitted fields in metadata (identified by the email submitted in the form, so incognito visitors are covered).
- `backend/src/routes/estimate.ts` — `POST /api/estimate` (home valuation) emits `form_submission` with the address and the estimate value in metadata.
- Pixel: **already implemented in this repo** — `src/components/analytics/SureSendPixel.tsx` is mounted in `src/app/layout.tsx` and driven by `NEXT_PUBLIC_SURESEND_PIXEL_ID` (returns null when unset), so no TODO placeholder was added; the env var was added to the root `env.example` instead.

### Ops scripts (Task 8) — `backend/scripts/` (TypeScript, matching the repo; run with `npx tsx`)
- `setup-suresend-fields.ts` — idempotently creates `portal_price_band` (dropdown), `portal_last_favorite_date` (date), `portal_search_cities` (multi_select from the Broward + Palm Beach entries in `backend/src/config/activeMarkets.ts`), `portal_engagement_score` (number). Checks `listCustomFields` first.
- `subscribe-repliers-webhooks.ts` — POSTs one subscription per event to `<REPLIERS_BASE_URL>/webhooks` with the matching `/api/webhooks/repliers/<event>` target URL; prints a results table. **Manual, post-plan-upgrade — not wired anywhere.**
- `register-suresend-webhook.ts` — creates the SureSend webhook (peopleUpdated, peopleStageUpdated, peopleTagsAdded → `<WEBHOOK_BASE_URL>/api/webhooks/suresend`), prints the `secretKey` ONCE with a loud store-it-now banner, then calls the test-webhook endpoint. **Manual.**
- `webhook-health.ts` — lists Repliers subscriptions and SureSend webhooks, checks local handshake secrets, exits nonzero on any missing/failed subscription. Cron-suitable.

### Verification (Task 9)
- `backend/src/routes/health.ts` — `GET /api/health/integrations`, protected with the repo's admin pattern (`middleware.jwt` + `middleware.role([Admin, Root])`). Returns SureSend identity check, pg-boss queue depths, processed events last 24h, unsent `pending_alerts` count, and the `webhook_secrets` rows present.
- Tests (mocha, matching the repo's suite):
  - `backend/test/services/suresend.test.ts` — retry logic with mocked fetch (429 Retry-After, 5-attempt cap, 5xx backoff, 3-attempt cap, no 4xx retry, merge flags, send/log flag, verifyConnection).
  - `backend/test/routes/webhooksSuresendRepliers.test.ts` — Repliers handshake persists+echoes the secret; delivery auth rejection (wrong key, no stored secret) and acceptance; SureSend HMAC valid/invalid/missing + eventId dedupe. Uses in-memory fakes for the repository and pg-boss.
  - `backend/test/jobs/repliersListing.test.ts` — price-drop branch with a mocked SureSend client: flag off → `pending_alerts` + live task/note; flag on → real `sendText`; no fans → no action; Expired → `listing_status_log` only. Plus `normalizeStatus` mapping.
- `backend/test/providers/index.ts` — added a pass-through stub for `middleware.tenantContext`. **Without this, the whole backend test suite crashed at load** ("unregistered dependency token") — the tenant-context feature landed without updating the test registry.

### Config / env
- `backend/src/config.ts` — new `suresend` and `integrations` config sections (see env vars).
- `backend/src/config/tenant.config.ts` — now also exports `tenantKey` (the resolved `'floridahomefinder' | 'countryclub'` string) for tenant-stamped table rows.
- `backend/env.example`, root `env.example` — new variables documented.

## New environment variables

Backend (`backend/env.example`):
| Variable | Purpose |
|---|---|
| `SURESEND_API_TOKEN` | app.suresend.ai > Settings > API Tokens |
| `SURESEND_WEBHOOK_SECRET` | printed once by `scripts/register-suresend-webhook.ts` |
| `SEND_LEAD_ALERTS` | master switch for lead-facing texts/emails; **defaults to false** (logs to `pending_alerts`) |
| `SLACK_WEBHOOK_URL` | optional; message alerts skip with a log line if unset |
| `WEBHOOK_BASE_URL` | public Railway URL of this backend (webhook target base) |
| `SURESEND_BASE_URL` | optional override, defaults to `https://api.suresend.ai/api/partner` |

`REPLIERS_API_KEY` already existed in this repo (server key; the CSR key is a separate frontend var).

Frontend (root `env.example`): `SURESEND_API_TOKEN`, `SURESEND_WEBHOOK_SECRET`, `NEXT_PUBLIC_SURESEND_PIXEL_ID` (all three already existed in `.env.local.example`; now documented in `env.example` too).

## New tables (knex migration `20260803000000_suresend_integration`)

| Table | Purpose |
|---|---|
| `suresend_person_map` | tenant, repliers_client_id (nullable), suresend_person_id, email (indexed), timestamps; unique (tenant, email) |
| `processed_webhook_events` | source (`repliers`\|`suresend`), dedupe_key (unique), processed_at — idempotency guard |
| `pending_alerts` | tenant, person_id, channel (`text`\|`email`), payload jsonb, reason, created_at, sent_at nullable — held-back lead alerts |
| `webhook_secrets` | source, event, secret, created_at; unique (source, event) — Repliers handshake secrets |
| `portal_favorites` | tenant, repliers_client_id, mls_number, created_at, removed_at nullable — local fan index for listing-updated |
| `listing_status_log` | tenant, mls_number, previous_status, new_status, payload jsonb — Expired/Withdrawn/Terminated prospecting feed |

pg-boss additionally manages its own `pgboss` schema outside knex (per the brief's explicit exception).

## Feature-flagged off

- All lead-facing texts and emails (search-match alerts, price-drop/status-change texts) go through `LeadAlertService`, gated by `SEND_LEAD_ALERTS` (default **false** → written to `pending_alerts` and logged). Agent-facing tasks and notes are always live. `SureSendService.sendText`/`sendEmail` exist but are only called through the gate or by future code that opts in.
- Slack notifications no-op (with a log line) until `SLACK_WEBHOOK_URL` is set.
- The whole outbound SureSend surface no-ops until `SURESEND_API_TOKEN` is set; the inbound webhook rejects everything until `SURESEND_WEBHOOK_SECRET` is set.

## Not completed / caveats

1. **SureSend and Repliers docs were unreachable from this build environment.** The sandbox's network policy returns 403 for `developers.suresend.ai`, `api.suresend.ai`, and `help.repliers.com`, so `llms.txt` and the webhooks guide could not be read. The client's endpoint paths/shapes follow the repo's existing frontend SureSend client (`src/services/suresend/client.ts`) plus the brief; endpoints the frontend didn't cover (`/identity`, `/groups`, `/users`, `/texts`, `/emails`, `/people/search` merge flags, `/webhooks/:id/test`) are **best-effort inferences and must be validated against the real API docs before go-live**. Same for the Repliers subscription API shape in `subscribe-repliers-webhooks.ts` (`event`/`target_url` field names, dot-separated event names).
2. **Repliers webhook payload shapes are assumed, defensively.** `backend/src/jobs/lib/payload.ts` probes both flat and wrapped (`{listing: …}`, `{client: …}`) shapes and never throws; field-name corrections after the first real deliveries should be confined to that one file.
3. **14 pre-existing backend test failures** (auth signup 400-vs-409, one listings status test, one stats test, scrubber fixtures) exist on the base branch — verified by running the suite on a pristine checkout of HEAD, which fails identically (and, before the `tenantContext` test stub, could not even load). Not caused by and not fixed by this work. New totals: 78 passing / 14 failing (was 56 / 14 at baseline).
4. **No local listings store.** The brief's "update the local listings store using the repo's existing sync logic" doesn't apply — listings are fetched live from Repliers; the existing sync service syncs FUB people. listing-created is dedupe+log; listing-deleted cleans up local favorites and notes fans.
5. **Route prefix.** All webhook routes live under the repo-wide `/api` prefix (`/api/webhooks/repliers/<event>`, `/api/webhooks/suresend`). The subscription/registration scripts already build URLs with the prefix.
6. A **parallel frontend SureSend integration already exists** (lead sync via `/api/suresend/lead`, an unauthenticated Next.js `/api/webhooks/suresend` logger route, pixel, admin widgets). It was left untouched per "do not modify existing integration code"; long-term the Next.js webhook logger route is redundant with the new backend receiver. Some of those frontend API routes (setup, admin leads/note/task) have **no auth guard** — pre-existing, flagged here for the developer handoff.
7. **Frontend tsc note:** a fresh clone shows 13 `Cannot find module '*.svg'` errors until `next-env.d.ts` is generated (it's gitignored and produced by `next dev`/`next build`). With it present, the frontend type-checks clean. No frontend source files were changed by this work.

## Assumptions about repo structure

- Backend is the integration home (Koa + tsyringe + knex + mocha); everything follows its conventions: injectable services, `provider` registry tokens, raw-SQL knex migrations, no-semicolon prettier style, `.js` import suffixes.
- `APP_TENANT` selects the brand; `tenant.brand.siteUrl` is the canonical listing-link base (`https://floridahomefinder.com` / `https://sflcountryclubhomes.com` as configured in the repo — the brief's `www.` variants were not introduced because the repo's tenant configs are the source of truth).
- "Community" tags come from the listing's `address.neighborhood` (falling back to city), slugified.
- The existing `repliers_webhooks` single-route receiver is a parallel legacy path; the new per-event routes are the ones the subscription script targets.
- The untouchable migration (`20260401000000_admin_users.ts`) was not modified, reformatted, or included in any refactor.

## How to verify locally

```bash
cd backend
npm install
npm run knex migrate:latest        # creates the six new tables
npm run build                      # tsc — passes
npm test                           # requires backend/test.env + a Postgres (see package.json test:localhost)
# health check once running with an admin JWT:
curl -H "Authorization: Bearer <admin-jwt>" localhost:8080/api/health/integrations
```

Go-live order: set `SURESEND_API_TOKEN` → run `setup-suresend-fields.ts` → deploy → run `register-suresend-webhook.ts` (store the printed secret) → after the Repliers plan upgrade, run `subscribe-repliers-webhooks.ts` → monitor with `webhook-health.ts` → only then consider flipping `SEND_LEAD_ALERTS`.
