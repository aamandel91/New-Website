# `NEXT_PUBLIC_REPLIERS_CSR_KEY` — exposure review

**Status:** OPEN — needs confirmation from Repliers support before launch.
**Filed:** 2026-06-27
**Owner:** @aamandel91

## Summary

The env var `NEXT_PUBLIC_REPLIERS_CSR_KEY` is consumed in 6 places in this
repo. Anything prefixed `NEXT_PUBLIC_` in Next.js is **inlined into the
client-side JavaScript bundle at build time** and is therefore visible to
every visitor via browser DevTools. This is by design for genuinely-public
identifiers (Mapbox public tokens, GA/GTM IDs, reCAPTCHA site keys) and is
unsafe for anything with write scope or scoped data access.

## Where it's used

| File | Line | Context |
|---|---|---|
| `src/services/API/APIClientSide.ts` | 2 | Client-side Repliers API calls |
| `src/services/API/APISearch.ts` | 17 | Listing search from the browser |
| `src/services/pageGeneration.ts` | 13 | CSR-mode page generation toggle |
| `src/services/marketing/fetchFeedProperties.ts` | 14 | Feed property fetch |
| `src/components/shared/LocationAutocomplete.tsx` | 10 | Location autocomplete in headers/forms |
| `src/components/templates/components/Header/components/Autosuggestion/Autosuggestion.tsx` | 71 | Header search autosuggest |
| `src/app/api/feed/ppc-page-feed/route.ts` | 47 | Server route that *also* reads the public var (see note) |

The server route in `ppc-page-feed/route.ts` reading a `NEXT_PUBLIC_` var is
itself a smell — server-only routes should read a non-public env var. If this
is the same secret, expose it as `REPLIERS_CSR_KEY` (no prefix) and have the
route read that instead; the client modules can keep the public var.

## What to confirm with Repliers

Ask their support / your account contact in writing:

1. Is `REPLIERS_CSR_KEY` intended to be safe in a client bundle (i.e.
   a "client-side read" key that Repliers expects to be public)?
2. What scope does the key have? Specifically:
   - Read-only? Or can it create / modify / delete records?
   - Can it return PII (lead data, agent contact details, etc.)?
   - Is it rate-limited / origin-locked / referrer-locked at Repliers' edge?
3. If it is **not** intended to be public, what's the recommended migration
   path? (Likely: move all CSR calls behind our own `/api/repliers/*` proxy
   route that holds a server-only key.)

## Decision tree

- **If Repliers confirms it's safe to publish:** add a comment in
  `env.example` and `.env.local.example` next to the var making that
  explicit, and rename the server route's read to a non-public var anyway
  (server code should never depend on `NEXT_PUBLIC_*`).
- **If it is NOT safe to publish:** rotate the key in the Repliers dashboard,
  add a server-only `REPLIERS_CSR_KEY`, create a thin
  `src/app/api/repliers/proxy/route.ts` that forwards requests with the
  server key, and update the 6 client call sites to hit the local proxy
  instead of `csr-api.repliers.io` directly. The Mapbox / GA / GTM /
  reCAPTCHA `NEXT_PUBLIC_*` vars are unaffected — those are legitimately
  public.

## Why this is open and not auto-fixed

Rotating a third-party API key without knowing its scope can take the site
down. The fix branch is the right call only after the conversation with
Repliers determines which path applies.
