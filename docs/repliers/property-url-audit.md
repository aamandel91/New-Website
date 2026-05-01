# Property URL Audit — `/listing/[slug]` vs `/homes/[slug]`

**Date:** 2026-05-01
**Branch:** `claude/setup-real-estate-frontend-018WhJZHrepD5oiSB8dz5W7m` @ `43238c9`
**Scope:** Read-only inventory of every property URL emitter in the repo. No code changes.

## Background

Two property URL schemes exist:

- **`/listing/[slug]`** — legacy/temporary. Slug = `street-city-state-zip-MLS-boardId`. Tied to a specific MLS record; URL changes when the listing is sold/relisted. Bad for long-term SEO equity.
- **`/homes/[slug]`** — permanent. Slug = address only (no MLS, no boardId). Same URL across listing cycles; accumulates SEO equity.

Per `src/utils/propertyUrls.ts:128`, `generatePropertyUrl()` is the canonical generator and it emits `/homes/` (with a `/listing/<mls>` last-resort fallback only when no address is present at all). `getSeoUrl()` in `src/utils/properties/seo.ts:22` is an older sibling that always emits `/listing/` (it uses `routes.listing = '/listing'` from `src/configs/defaults/routes.ts:16`).

## Summary

- **Total property-link emitters identified:** 19 distinct call sites across 16 files
- ✓ **Using permanent `/homes/`:** 6 sites (sitemap × 3, admin index, homes/[slug] canonical, listing/[slug] canonical, MoreProperties — all via `generatePropertyUrl`/`generateStaticPropertyUrl`)
- ✗ **Using temporary `/listing/`:** 13 sites — most user-visible card/link surfaces
- ⚠ **Depends-on-input:** 1 (the `generatePropertyUrl` last-resort branch — only fires when address fields are entirely absent)

## Top concerns (ranked by SEO impact)

1. **Search results card (`PropertyCard`) emits `/listing/`.** Every card on `/search/*`, on the map (grid/table/drawer), in carousels, and on the PDP "Similar Properties" rail goes through `getSeoUrl()` → `/listing/`. This is the dominant in-product property link surface. Internal linking equity is currently flowing into temporary URLs that turn over with each listing cycle.
2. **Property OG / `og:url` metadata uses `/listing/`.** `formatMetadata()` in `src/utils/properties/formatters.ts:76` sets `openGraph.url = host + getSeoUrl(property)`. That's what social cards and link unfurls expose. The HTML `<link rel="canonical">` is correctly `/homes/` (set in both PDP routes), so canonical and OG URL disagree.
3. **JSON-LD breadcrumb on the PDP points the property item at `/listing/<mlsNumber>`.** `src/utils/propertySchema.ts:160` hard-codes `/listing/${mlsNumber}`. Google's structured data pipeline will index the temporary URL, not the permanent one.
4. **Marketing feeds (Google Real Estate, Google Page Feed, Facebook Catalog, RSS/XML) all use `/listing/`.** `src/services/marketing/feedGenerator.ts:79,102,125,222` hand-rolls `${baseUrl}/listing/${listing_id}`. Outbound destination URLs in paid-media feeds will break per listing cycle — wasting ad spend and triggering disapprovals when feed URLs 404.
5. **No `/listing/` → `/homes/` 301 redirect exists.** `next.config.mjs:60` only redirects `/florida/:path*`. The `/listing/[slug]` route renders a full PDP with a small "Permanent link" anchor at the bottom of the page (`src/app/listing/[slug]/page.tsx:100`). Until a 301 is added, all the inbound `/listing/` traffic plus all of the internal `/listing/` links keep accumulating equity on the wrong URL.

## Per-component findings

### Cards and lists

| Component | URL scheme | Generator | Notes |
|---|---|---|---|
| `src/components/shared/Property/Card/Card.tsx:63` | ✗ `/listing/` | `getSeoUrl()` | The shared `PropertyCard` — the dominant link surface (search grid/table/map drawer, similar properties, featured properties, recently-viewed, favorites grid, comparables carousels). |
| `src/components/pages/home/components/FeaturedProperties.tsx:8,76` | ✗ `/listing/` | via `PropertyCard` | Homepage featured tiles. |
| `src/components/pages/search/components/MapRoot/components/GridContent/GridContent.tsx:11,248` | ✗ `/listing/` | via `PropertyCard` | Search grid layout. |
| `src/components/pages/search/components/MapRoot/components/PropertyDrawer.tsx:9,77` | ✗ `/listing/` | via `PropertyCard` | Map-mode property drawer. |
| `src/components/pages/search/components/MapRoot/components/TableContent/TableContent.tsx:131` | ✗ `/listing/` | `getSeoUrl()` | Open-in-new-tab from table row click. |
| `src/components/pages/search/components/MapRoot/MapRoot.tsx:199,226` | ✗ `/listing/` | `getSeoUrl()` | Marker click handler navigation. |
| `src/services/Map/MarkerExtension.ts:109` | ✗ `/listing/` | `getSeoUrl()` | Map marker `<a>` href used by the marker DOM element. |
| `src/services/Map/PopupExtension.tsx:14,62` | ✗ `/listing/` | via `PropertyCard` | Map marker popup. |
| `src/components/property-detail/SimilarProperties.tsx:16,168` | ✗ `/listing/` | via `PropertyCard` | PDP "Similar Properties" carousel. |
| `src/components/property-detail/MoreProperties.tsx:89,99` | ✓ `/homes/` | `generatePropertyUrl()` | PDP "More Properties" SEO list. The only PDP cross-link list using the permanent scheme. |
| `src/components/property-detail/ExploreMore.tsx:47,126,151` | n/a | (no link) | `MiniPropertyCard` does not wrap the property in an `<a>`, so no URL emitted. |
| `src/components/property-detail/PropertyComparables.tsx` | n/a | (no link) | Comparables table does not link to comp PDPs. |
| `src/components/templates/components/Header/components/Autosuggestion/components/OptionListing.tsx:5,20` | ✗ `/listing/` | `getSeoUrl()` | Header autosuggest property option link. |
| `src/components/templates/components/Header/components/Autosuggestion/Autosuggestion.tsx:43,451` | ✗ `/listing/` | `getSeoUrl()` | Programmatic `router.push` from autosuggest selection. |
| `src/components/shared/Dialogs/PropertyDialog/components/StaticPageButton.tsx:7,11` | ✗ `/listing/` | `getSeoUrl()` | "View full page" button inside the property modal. |
| `src/components/shared/Dialogs/PropertyDialog/PropertyDialog.tsx:15,61` | ✗ `/listing/` | `getSeoUrl()` | `updateWindowHistory()` rewrites the address bar to the `/listing/` URL while the modal is open. |
| `src/components/shared/Dialogs/AiSearchDialog/components/ImageFavoritesItem.tsx:18,49` | ✗ `/listing/` | `getSeoUrl()` | AI-search image favorite link. |
| `src/components/pages/listing/components/HistoryDetails/HistoryItem.tsx:12,44` | ✗ `/listing/` | `getSeoUrl()` | Address history item link in PDP. |
| `src/components/pages/listing/components/ShareButton.tsx:10,21,30,67,81` | ✗ `/listing/` | `getSeoUrl()` | Share menu — builds the URL users send to friends/social. |
| `src/components/property-detail/PropertyHeader.tsx:202,204` | ✗ `/listing/` | hand-rolled | "Start an Offer" button parses the current URL with `pathname.split('/listing/')[1]` and writes `/listing/${slug}/offer` — both the consumer and the producer assume the `/listing/` route. (See route-coupling note below.) |
| `src/app/account/favorites/page.tsx:62` | ✗ `/listing/` | hand-rolled | Favorites grid links to `/listing/${fav.mlsNumber}` (just MLS, no slug). |
| `src/app/admin/property-index/page.tsx:371` | ✓ `/homes/` | hand-rolled (`/homes/${entry.slug}`) | Admin tool — internal use, indexing into `homes/[slug]`. |
| `src/app/listing/[slug]/openhouse/page.tsx:91` | (n/a redirect) | hand-rolled | Back link from openhouse sub-route to its parent `/listing/[slug]`. Stays inside the `/listing/` route by design. |
| `src/app/listing/[slug]/offer/page.tsx:163` | (n/a redirect) | hand-rolled | Same — the offer sub-route's back link to `/listing/[slug]`. |

### PDP cross-links

| Component | URL scheme | Notes |
|---|---|---|
| `SimilarProperties` carousel | ✗ `/listing/` | Uses `PropertyCard` → `getSeoUrl`. Highest-volume PDP cross-link. |
| `MoreProperties` SEO list | ✓ `/homes/` | The good one — already on `generatePropertyUrl`. |
| `ExploreMore` mini-cards | n/a | No links emitted. |
| `PropertyComparables` | n/a | No links emitted. |
| `RelatedBlogs` | n/a (blog URLs only) | Out of scope. |

### Sitemap (`src/app/sitemaps/[type]/route.ts`)

✓ All property URLs in every sitemap type use `/homes/`:

- `generateActive()` → `${BASE_URL}${generateStaticPropertyUrl(listing.address || {})}` (line 49)
- `generateSold()` cached path → `${BASE_URL}/homes/${entry.slug}` (line 71)
- `generateSold()` fallback → `${BASE_URL}${generateStaticPropertyUrl(...)}` (line 116)

**This is the single most important place to be correct, and it is.** Caveat: `generateStaticPropertyUrl` produces a degenerate slug (`'-'`) if `listing.address` is empty/missing — none of these sites validate for that. Worth flagging in a follow-up.

### Structured data (JSON-LD)

| Emitter | URL emitted | Notes |
|---|---|---|
| `src/utils/propertySchema.ts` `generatePropertyJsonLd(property, url)` (the `RealEstateListing` `@id`/`url`) | Whatever is passed as `url` arg | Both PDP routes pass a `/homes/` or `/listing/` URL depending on the route hit. From `/homes/[slug]`: ✓ `/homes/`. From `/listing/[slug]`: ⚠ depends on the `/listing/` route path; the PDP at `src/app/listing/[slug]/page.tsx:67` builds `propertyUrl` via `generatePropertyUrl()` which emits `/homes/` if address exists — so the JSON-LD `@id` is `/homes/` even on the `/listing/` route. ✓ |
| `src/utils/propertySchema.ts:160` `generatePropertyBreadcrumbJsonLd()` | ✗ `/listing/${property.mlsNumber}` | Hard-coded. The breadcrumb on **every** PDP — both `/listing/` and `/homes/` routes — points the leaf item at `/listing/<mls>`. This is a structured-data leak of the temporary scheme. |
| `src/app/property/[mlsNumber]/page.tsx:142` | ✗ `/property/${mlsNumber}` | Different scheme entirely (`/property/`) — out of scope for this audit but worth noting it's neither `/listing/` nor `/homes/`. |

### OG / metadata

| Page | Canonical | OG `url` | Notes |
|---|---|---|---|
| `/homes/[slug]` (`src/app/homes/[slug]/page.tsx:177`) | ✓ `/homes/${slug}` | Inherits — `openGraph` block at line 169 omits `url`, and `next/metadata` derives canonical for `og:url`. Effectively ✓. |
| `/listing/[slug]` (`src/app/listing/[slug]/page.tsx:42-49`) | ✓ `/homes/...` (set explicitly via `generateStaticPropertyUrl`) | ✗ `/listing/...` (from `formatMetadata` → `getSeoUrl`) | **Canonical and OG URL disagree on the `/listing/` route.** Crawlers prioritize canonical, but social platforms cache `og:url` independently. |
| `/homedetails/[slug]` (`src/app/homedetails/[slug]/page.tsx`) | ✓ `/homes/...` | ✗ `/listing/...` | Same pattern as `/listing/[slug]`. (This route appears to be a duplicate of `/listing/[slug]` — separate cleanup question.) |

### Marketing feeds (paid ads / catalogs)

`src/services/marketing/feedGenerator.ts` — hand-rolled `${baseUrl}/listing/${listing_id}`:

- Line 79: Google Real Estate `Final URL`
- Line 102: Google Page Feed `Page URL`
- Line 125: Facebook Catalog `link`
- Line 222: RSS/XML `<link>`

These are the destination URLs Google Ads, Facebook, and other downstream feeds use to send users to a property. They will break (404) over time as listings turn over. **`fetchFeedProperties.ts:38` correctly builds the `url` field on the in-memory `RemarketingPropertyData` using `generatePropertyUrl()`, but `feedGenerator.ts` ignores that field and reconstructs `/listing/${listing_id}` from scratch.** That's a regression / inconsistency within the marketing layer.

### AI-generated content

- `backend/src/services/aiContent.ts` — no URL emission. The prompt at line 119 mentions "listing prep" as a topic but never instructs the model to embed property URLs.
- `backend/src/services/blogs.ts` — line 161 only references `'listing'` as a content tag. No property URLs.
- No post-processing layer rewrites URLs in AI output. ✓ Effectively a non-issue today.

### Backward compatibility

- **`/listing/[slug]` route status:** still exists and renders a full PDP (`src/app/listing/[slug]/page.tsx`). Not redirected.
- **`/listing/` → `/homes/` 301 redirect:** ✗ does not exist. `next.config.mjs:60` only contains the `/florida/:path*` redirect.
- **In-page hint:** the `/listing/` PDP shows a "Permanent link" anchor at the bottom of the page pointing at the `/homes/` URL (`src/app/listing/[slug]/page.tsx:100-108`). That's a visible hint to users but not a search-engine signal — Google does not treat content links as canonicals.
- **`/homedetails/[slug]`:** same pattern as `/listing/[slug]` — duplicates the PDP and sets canonical to `/homes/` but does not redirect. Looks like a third URL space to consolidate.
- **`/property/[mlsNumber]`:** a fourth property URL space (line 142 of that page builds `${host}/property/${mlsNumber}` for JSON-LD). Out of scope for this audit but flag for follow-up.

## Detailed findings

### ✗ Issues to fix

1. **`src/utils/properties/seo.ts:22-41` `getSeoUrl()`** — the dominant card/link generator emits `/listing/` for every caller (search results, map, autosuggest, share, history, dialogs, PDP similar properties). Either retarget it at `routes.homes` (and switch its `seoUrlPath` construction to drop MLS/boardId) or replace its callers with `generatePropertyUrl()`. Most callers don't need MLS/boardId in the URL — those that do (e.g. `?startImage=`) can append it as a query param on the `/homes/` URL.
2. **`src/utils/propertySchema.ts:160`** — hard-coded `/listing/${property.mlsNumber}` in `generatePropertyBreadcrumbJsonLd`. Replace with `generateStaticPropertyUrl(property.address)` when address available.
3. **`src/services/marketing/feedGenerator.ts:79, 102, 125, 222`** — hand-rolled `${baseUrl}/listing/${listing_id}`. Replace with `${baseUrl}${property.url}` where `property.url` is the field already built by `fetchFeedProperties.ts:38` via `generatePropertyUrl()`. (Also keeps the marketing layer DRY.)
4. **`src/utils/properties/formatters.ts:76`** — `formatMetadata.openGraph.url = host + getSeoUrl(property)`. Switch to `generatePropertyUrl(property.address || {}, property.mlsNumber)` so OG and canonical agree.
5. **`src/app/account/favorites/page.tsx:62`** — `href={`/listing/${fav.mlsNumber}`}` is doubly bad: it's `/listing/`, *and* it's MLS-only (no slug), which forces the `/listing/[slug]` route to a degenerate slug. Build the URL via `generatePropertyUrl()` if address is available on the favorite, otherwise navigate via `/homes/` lookup.
6. **`src/components/property-detail/PropertyHeader.tsx:201-205`** — "Start an Offer" handler is hard-coupled to the `/listing/` route via `pathname.split('/listing/')[1]`. Once `getSeoUrl` is migrated, this won't work from `/homes/` PDPs. Either route the offer sub-page off `/homes/[slug]/offer` or read the slug from `usePathname()` regardless of prefix.
7. **No `/listing/` → `/homes/` 301 redirect.** Either:
   - Add a `redirects()` entry in `next.config.mjs` (static — works only if the `/homes/` slug is recoverable from the request without an API call; it's not, so this option doesn't apply directly).
   - Add a server-side redirect inside `src/app/listing/[slug]/page.tsx` (use `import { redirect } from 'next/navigation'` after fetching the property and computing `generateStaticPropertyUrl(property.address)`, returning a `permanentRedirect`). This preserves SEO equity and consolidates the canonical signal.
8. **`/homedetails/[slug]`** — separate route duplicating PDP behavior, also missing redirect to `/homes/`. Likely should be deleted or redirected.

### ✓ Already correct

- `src/app/sitemaps/[type]/route.ts:49,71,116` — sitemap entries use `/homes/`.
- `src/app/homes/[slug]/page.tsx:177,237` — homes route's own canonical and `host`-prefixed URL.
- `src/app/listing/[slug]/page.tsx:42-49,67` — canonical points to `/homes/`; `propertyUrl` for JSON-LD `@id` resolves to `/homes/` (via `generatePropertyUrl` when address present).
- `src/app/homedetails/[slug]/page.tsx:41,64` — same pattern as `/listing/[slug]`: canonical and JSON-LD `@id` are `/homes/`.
- `src/components/property-detail/MoreProperties.tsx:89,99` — uses `generatePropertyUrl()`.
- `src/components/shared/ComparisonBar.tsx:21` — imports `generatePropertyUrl` (verified used downstream in `src/app/compare/page.tsx:92`).
- `src/app/compare/page.tsx:92` — uses `generatePropertyUrl()`.
- `src/services/marketing/fetchFeedProperties.ts:38` — `RemarketingPropertyData.url` is built from `generatePropertyUrl()`. (But `feedGenerator.ts` discards this and re-builds `/listing/`, so the practical effect is lost — see issue #3.)
- `src/app/api/cron/property-sync/route.ts:29`, `src/app/api/admin/backfill/route.ts:61,105` — admin/cron jobs use `generateStaticPropertyUrl()` for the property index.
- `src/app/admin/property-index/page.tsx:371` — admin tool links via `/homes/${entry.slug}`.
- `src/app/api/og/property/route.tsx` — OG image route is keyed by `/homes/` slug (`parseAddressSlug`) — already permanent-aware.

### `generatePropertyUrl` last-resort branch (⚠ depends-on-input)

`src/utils/propertyUrls.ts:156-159` falls back to `/listing/${mlsNumber}` when no address fields (street/streetNumber/streetName) are populated and an MLS number is available. This is **not a bug** — it's a defensive path so consumers never get an empty URL. But it's an exposure: anywhere we feed it a stripped property object (e.g. one fetched without `fields=address.*`), we'll silently emit a `/listing/` URL. Worth instrumenting (log + alert) once the migration starts so we can detect calls hitting the fallback.

## Recommendations (prioritized)

1. **Add `/listing/[slug]` → `/homes/[slug-from-address]` 301 redirect inside the `/listing/[slug]` route handler.** Single-line change that preserves all inbound link equity and consolidates the canonical signal. (Highest impact-to-effort ratio.)
2. **Migrate `getSeoUrl()` to emit `/homes/` (or replace its callers).** This is the largest behavioral change but eliminates ~12 of the 13 `/listing/` emitters in one move. Recommend changing the implementation rather than touching each caller.
3. **Fix `generatePropertyBreadcrumbJsonLd` (`propertySchema.ts:160`)** to emit a `/homes/` URL. Single line.
4. **Fix marketing feed generators (`feedGenerator.ts:79,102,125,222`)** to use the already-correct `property.url` field. Single-file change.
5. **Fix OG `url` in `formatMetadata` (`formatters.ts:76`)** so OG and canonical agree.
6. **Fix `account/favorites/page.tsx:62`** to use `generatePropertyUrl` (or persist the address slug at favorite-time).
7. **Decouple "Start an Offer" handler in `PropertyHeader.tsx`** from the `/listing/` pathname so it works under `/homes/` after the migration.
8. **Audit `/homedetails/[slug]` and `/property/[mlsNumber]` routes** — both look like dead/duplicate URL spaces. Either consolidate or add redirects.
9. **Add a one-time alert/log on the `generatePropertyUrl` last-resort branch** to detect missing-address inputs during the rollout window.
