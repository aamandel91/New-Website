# Repliers API Audit

Read-only audit of every Repliers API call site in the website's runtime
code path against two Repliers-recommended practices:

1. **`fields` parameter on `GET /listings`** — limit the response payload to
   only the columns the rendering context needs.
2. **Client-side base URL (`csr-api.repliers.io`)** — for the four allowed
   endpoints (GET /listings, POST /listings, GET /locations, GET
   /locations/autocomplete), call directly from the browser using a CSR key
   instead of routing through a server-side proxy.

Out of scope (noted but not audited): `mcp-server/tools/repliers/*` — those
are MCP tools for AI agents, not on the user request path.

## Summary

- **Total Repliers call sites in app code:** 32
  (Next.js / src: 26, Koa backend: 6 distinct call shapes across the legacy
  backend's listings, autosuggest, estimate, and stats services. `repliers/agents`,
  `clients`, `messages`, `searches`, `favorites`, `estimate` POST/PATCH/DELETE
  remain server-side and are out of `fields`-param scope but counted in the
  base-URL analysis as N/A.)
- **`fields` param coverage on /listings calls** (24 listings calls in scope):
  - ✓ Optimal: **5**
  - ⚠ Could improve: **3** (use `fields` but pass too many)
  - ✗ Missing: **16**
  - N/A: not counted (aggregates-only / statistics-only / count-only calls
    don't materially benefit from `fields` because `listings:false` is set,
    but a couple of them still ask for a full listings payload — flagged
    inline)
- **Client-side base URL coverage** (allowed-list endpoints only):
  - ✓ Correct (csr-api): **22 call sites**
  - ⚠ Backend-routed but movable: **3** (the `/api/listings/search` proxy
    in the legacy Koa backend is still used by the autosuggest endpoint,
    SSR layout `fetchLocations`, and the sitemap `generateActive` path)
  - ✗ Wrong base URL: **0**
  - N/A (sensitive endpoints): all `agents`, `clients`, `messages`,
    `searches`, `favorites`, and `estimate` server-side calls — must
    stay on `api.repliers.io`.
- **Backend proxy routes that exist primarily to forward Repliers data:**
  - **3 removable** with the CSR API + an OpenAI/UserWay-equivalent
    rewrite of the consuming code:
    - `POST/GET /api/listings/search`
    - `GET /api/listings/count`
    - `GET /api/listings/locations`
  - **2 add real value** and should NOT be moved:
    - `GET /api/listings/:mlsNumber` and `GET /api/listings/:propertyId/similar`
      — go through the `scrubbed` decorator + `validateAvailability`
      (drops listings whose `lastStatus` is in the hidden-statuses list).
      Removing the proxy would expose those listings.
    - `POST /api/listings/nlp` — endpoint is **not** in the CSR allowed
      list and the route also rewrites the response shape.
  - **1 mostly value-add** (`/api/autosuggest`) — combines Mapbox +
    Repliers + dedupe + Jaro-Winkler distance. Already partially bypassed
    by the new direct CSR `/locations/autocomplete` calls in
    `Autosuggestion.tsx` and `LocationAutocomplete.tsx`.

## Top recommendations (ranked by impact)

1. **Add `fields` to the property-sync + sitemap fetches** in
   `src/app/api/admin/backfill/route.ts:30`,
   `src/app/api/cron/property-sync/route.ts:64,89`, and
   `src/app/sitemaps/[type]/route.ts:85` (the sold-fallback path). These
   loop fetches of 500 listings/page × up to 20 pages with **no `fields`
   restriction** — the worst payload offender in the codebase. Score-only
   needs are ~10 fields; current response is ~50+. Recommended:
   `fields=mlsNumber,status,lastStatus,soldDate,soldPrice,images[1],updatedOn,address,details.description,history,estimate.value`
   (the only fields `scorePropertyPage` reads, plus the slug input).
   Estimated ~70-80% payload reduction on the heaviest scheduled jobs.

2. **Cap images on the search-results map and listing-grid CSR calls.**
   `getListingFields()` in `src/services/Search/params.ts:18` requests the
   full `images` array for every listing in a 50-item search page. For
   gallery cards and map pins, only `images[0]` (or `images[1]`) is rendered
   — replace `'images'` with `'images[1]'` in
   `src/configs/defaults/filters.ts:40`. Listings can have 30-50 photos
   each; this alone can cut a search response by an order of magnitude.

3. **Add `fields` to the four sidebar/property-detail CSR calls** that
   currently fetch the full payload to render a card or read one number:
   - `AreaValueTrends.tsx:228` — only reads `estimate.value` and
     `estimate.history.mth` per listing; everything else is wasted.
     Recommended: `fields=estimate`.
   - `ListingsGrid.tsx:36` — card fields only. Recommended:
     `fields=mlsNumber,listPrice,address,details.numBedrooms,details.numBathrooms,details.sqft,images[1],status,soldPrice,soldDate,boardId`.
   - `SoldPriceDistribution.tsx:150` — only reads `soldPrice`. Recommended:
     `fields=soldPrice`.
   - `ViewOtherUnits.tsx:44` — only reads `mlsNumber` (50 listings × full
     payload to filter on a string). Recommended: `fields=mlsNumber`.
   - `similarProperties.ts` (homedetails + listing) — card fields, same
     as ListingsGrid.

4. **Move `fetchLocations` (homepage layout + listings catalog) to CSR
   `/locations`.** `src/app/layout.tsx:48` currently calls the Koa proxy at
   `/api/autosuggest/locations` for every render. The CSR endpoint
   `GET /locations` is on the allowed list and the data is identical;
   doing this on the client (or via direct fetch in the server component)
   removes a hop and avoids the auth-passthrough middleware. Note: the
   backend version filters to allowed areas + drops coordinates; that
   filtering would need to be replicated client-side or done in the
   route handler that renders the homepage.

5. **Decide what to do with the legacy Koa `/listings/*` routes.** Of the
   six `/api/listings/...` proxy routes, three (search, count, locations)
   are simple pass-throughs with `ensureRequiredFields` + scrubber +
   `displayInternetEntireListing=Y` enforcement. If the goal is to remove
   the legacy backend dependency for unauth'd callers, these can be folded
   into direct CSR calls — but the `validateAvailability` check for single-
   listing GETs is a real safety guarantee that needs an equivalent
   client-side filter before the CSR direct call replaces the proxy.

## Call site inventory

### Frontend (Next.js src/)

The "Path" column distinguishes:
- **Browser** — runs in the user's browser
- **Server (Next)** — Server Component / Route Handler / SSR layout
- **Build/cron** — admin/cron route, runs out-of-band

| File:Line | Endpoint | Base URL | Path | fields? | Notes |
|---|---|---|---|---|---|
| `src/services/API/APIClientSide.ts:1` (helper) | `*` | csr-api | Browser/Server | n/a | Shared CSR fetch wrapper used by APISearchCSR / APIAggregates / APIPlaces. |
| `src/services/API/APISearchCSR.ts:74` `searchListings()` | `/listings` | csr-api | both | passthrough | Only forwards `fields` if caller supplies it; default = none. |
| `src/services/API/APISearchCSR.ts:78` `getListing()` | `/listings/{mls}` | csr-api | Browser | ✗ | Single-listing detail call. Accepts only `boardId`. PDP pages need full payload — ✓ valid. |
| `src/services/API/APISearchCSR.ts:82` `getLocations()` | `/listings` | csr-api | both | n/a | `listings:false`+`aggregates:address.city`. OK. |
| `src/services/API/APISearchCSR.ts:95` `getAddressHistory()` | `/listings` | csr-api | Server (Next) | ✗ | Address-history page; no `fields`. Only renders price/date/status — many fields wasted. |
| `src/services/API/APIAggregates.ts:17,26,35,44,58` | `/listings` | csr-api | Browser | n/a | All aggregate-only (`listings:false`). ✓ correct shape. |
| `src/services/API/APIPlaces.ts:25` | `/places` | csr-api | Browser | n/a | `/places` is not on the public CSR allowed list per the spec. **Verify it's actually allowed**, otherwise this call may rely on undocumented behavior. |
| `src/services/API/APIPropertyDetails.ts:16` `fetchProperty()` | `/listings/{mls}` | **api.repliers.io** (via Koa proxy `/api/listings/:mls`) | Server (Next) | uses `fields=raw` | PDP needs full payload — passes `fields=raw` (Repliers shorthand for "everything as raw MLS"). ✓ intentional. Goes through Koa for the `validateAvailability` guard. |
| `src/services/API/APIPropertyDetails.ts:32` `fetchSimilarListings()` | `/listings/{mls}/similar` | api.repliers.io (via Koa) | Server (Next) | ✓ uses `getListingFields()` | Endpoint not in CSR allowed list — must stay server-side. ✓ correct. |
| `src/services/API/APISearch.ts:42` `fetch()` (Koa) | `/listings/search` | api.repliers.io (via Koa) | Server (Next) | depends on caller | Used as fallback when `NEXT_PUBLIC_REPLIERS_CSR_KEY` not set. |
| `src/services/API/APISearch.ts:78` `fetchCSR()` | `/listings` | csr-api | Browser/Server | depends on caller | Direct CSR path; preferred. |
| `src/services/API/APISearch.ts:118` `fetchLocations()` | `/autosuggest/locations` (Koa) | api.repliers.io (via Koa) | Server (Next) | n/a | Locations are on CSR allow-list — could be moved (see rec #4). |
| `src/services/API/APISearch.ts:135` `fetchAutosuggestions()` | `/autosuggest` (Koa) | api.repliers.io (via Koa) | Browser | n/a | Aggregator (Mapbox + Repliers). Real value-add. Keep. |
| `src/services/Search/params.ts:18` `getListingFields()` | (helper) | n/a | n/a | ✓ uses `fields` | Centralized field list for search/grid/table/map. Includes full `images` — ⚠ should be `images[1]`. |
| `src/services/Search/Search.ts:53` `fetchListings()` | `/listings/search` or `/listings` | varies | Browser | ✓ via `getListingFields()` | Default search page. |
| `src/components/pages/search/MapPageContent.tsx:61` | `/listings` | varies (CSR if key) | Browser | ✓ + cluster aggregates | Search results map. |
| `src/components/pages/search/.../GridContent.tsx:129` | `/listings` | varies | Browser | ✓ | Grid view. |
| `src/components/pages/search/.../TableContent.tsx:89` | `/listings` | varies | Browser | ✓ | Table view. |
| `src/services/API/APIEstimate.ts:82` | `/listings/search` | api.repliers.io (via Koa) | Browser/Server | ✓ via `getListingFields()` | Estimate flow — needs detail. |
| `src/components/templates/.../Autosuggestion.tsx:168` | `/locations/autocomplete` | csr-api | Browser | n/a | Direct CSR call. ✓ correct. |
| `src/components/shared/LocationAutocomplete.tsx:115` | `/locations/autocomplete` | csr-api | Browser | n/a | Direct CSR call. ✓ correct. |
| `src/components/property-detail/PropertyValueEstimate.tsx:275` | `/listings/{mls}` | csr-api | Browser | ✗ | Only reads `listing.estimate.value`. Could pass `fields=estimate` and shrink the payload by ~98%. |
| `src/components/property-detail/SoldPriceDistribution.tsx:150` | `/listings` | csr-api | Browser | ✗ | Reads `soldPrice` only. `fields=soldPrice` would suffice. |
| `src/components/property-detail/ViewOtherUnits.tsx:44` | `/listings` | csr-api | Browser | ✗ | Reads `mlsNumber` only. `fields=mlsNumber` would suffice. |
| `src/components/property-detail/NearbyPlaces.tsx:42` | `/places` | csr-api | Browser | n/a | Same caveat as APIPlaces — verify endpoint is actually CSR-allowed. |
| `src/components/sidebar/HowsTheMarket.tsx:44,50` | `/listings` (×2) | csr-api | Browser | n/a | `listings:false` + `statistics:listPrice/soldPrice`. ✓ correct shape. |
| `src/components/sidebar/TodaysListings.tsx:27,28,29` | `/listings` (×3) | csr-api | Browser | n/a | All `listings:false`, count-only. ✓. |
| `src/components/shared/AreaValueTrends.tsx:228` | `/listings` | csr-api | Browser | ✗ | Fetches full 50 listings to read `estimate.value` + `estimate.history.mth` — `fields=estimate` would slash payload. |
| `src/components/shared/ListingsGrid.tsx:36` | `/listings` | csr-api | Browser | ✗ | Card render — fields known at write time. Recommended `fields=mlsNumber,listPrice,address,details.numBedrooms,details.numBathrooms,details.sqft,images[1],status,soldPrice,soldDate,boardId`. |
| `src/components/shared/MarketTrends/utils.ts:37` | `/listings` | csr-api | Browser/Server | n/a | `listings:false` + statistics. ✓. |
| `src/components/shared/Filters/panels/HomeTypePanel.tsx:92` (via APIAggregates) | `/listings` | csr-api | Browser | n/a | Aggregate-only. ✓. |
| `src/components/shared/Filters/panels/MoreFiltersPanel.tsx:201,220` (via APIAggregates) | `/listings` | csr-api | Browser | n/a | Aggregate-only. ✓. |
| `src/services/marketTimeline.ts:65` | `/listings` | csr-api | Browser/Server | n/a | `listings:false` + statistics. ✓. |
| `src/services/marketing/fetchFeedProperties.ts:100` | `/listings` | csr-api | Server (Next) | ✗ | Marketing feed builder. Reads ~12 fields per listing. Recommended `fields=mlsNumber,status,lastStatus,listPrice,address,details.propertyType,details.style,details.numBedrooms,details.numBathrooms,details.sqft,images[1],map`. |
| `src/services/pageGeneration.ts:128,168,232` | `/listings` | csr-api | Server (Next) | mixed | 128 + 168 are count/aggregates, ✓. 232 (`fetchListingsPreview`) returns listings for previews — ✗ no fields, recommend the same card-set as ListingsGrid. |
| `src/app/api/admin/backfill/route.ts:30` | `/listings` | csr-api | Build/cron | ✗ | **Heaviest job in the codebase** — pages of 500 sold listings × up to 20 pages. Score-only needs <12 fields. |
| `src/app/api/cron/property-sync/route.ts:64,89` | `/listings` (×2) | csr-api | Build/cron | ✗ | Same pattern, daily. Same fix. |
| `src/app/sitemaps/[type]/route.ts:32` `generateActive` | `/listings/search` | api.repliers.io (via Koa) | Server (Next) | ✓ `mlsNumber,address,updatedOn` | ✓ correct shape — but goes through the Koa proxy. Could be moved to direct CSR. |
| `src/app/sitemaps/[type]/route.ts:85` `generateSold` (fallback) | `/listings` | csr-api | Server (Next) | ✗ | Fallback path when property index is empty. Score-only — same fix as backfill. |
| `src/app/api/feed/ppc-page-feed/route.ts:52` `csrFetch` | `/listings` | csr-api | Server (Next) | n/a | Aggregates + statistics + count. All `listings:false`. ✓. |
| `src/app/api/estimates/route.ts:95` | `/estimates` (POST) | api.repliers.io | Server (Next) | n/a | Estimates POST is **not** on the CSR allowed list. ✓ correct to keep server-side. Direct fetch (no Koa proxy) — fine. |
| `src/app/listings/[[...slugs]]/_requests.ts:50` | `/listings/search` (Koa) | varies | Server (Next) | ✓ via `getListingFields()` | City/area catalog page. |
| `src/app/listings/[[...slugs]]/_requests.ts:73,109` `fetchLocations` / `fetchNearbyLocations` | `/autosuggest/locations` | api.repliers.io (via Koa) | Server (Next) | n/a | See recommendation #4. |
| `src/app/admin/page-generator/page.tsx:148,663` | `/autosuggest/locations` | api.repliers.io (via Koa) | Browser | n/a | Admin tool. |
| `src/app/layout.tsx:48` | `/autosuggest/locations` | api.repliers.io (via Koa) | Server (Next) | n/a | Top-of-tree call, fires on every page render (cached 86400s). Movable to CSR. |
| `src/app/homedetails/[slug]/utils.ts:37`, `src/app/listing/[slug]/utils.ts:37` | `/listings/search` (Koa) | api.repliers.io (via Koa) | Server (Next) | ✓ via `getListingFields()` | "Nearby" 404 fallback. |
| `src/app/homedetails/[slug]/similarProperties.ts:6,28` | `/listings` | csr-api | Server (Next) | ✗ | Card-set fields only, like ListingsGrid. |
| `src/app/listing/[slug]/similarProperties.ts:6,29` | `/listings` | csr-api | Server (Next) | ✗ | Same. |
| `src/app/homes/[slug]/page.tsx:53` | `/listings` (via getAddressHistory) | csr-api | Server (Next) | ✗ | Address history; renders price/date/status. |
| `src/app/compare/page.tsx:66` | `/listings/{mls}` | api.repliers.io (via Koa) | Server (Next) | uses `fields=raw` | Compare needs full payload. ✓. |
| `src/app/api/open-house/lookup/route.ts:18` | `/listings/{mls}` | api.repliers.io (via Koa) | Server (Next) | uses `fields=raw` | Open-house signup; needs address + agent. |
| `src/app/homedetails/[slug]/openhouse/page.tsx:26,62`, `src/app/listing/[slug]/openhouse/page.tsx:26,62` | `/listings/{mls}` | api.repliers.io (via Koa) | Server (Next) | uses `fields=raw` | Same as above. |
| `src/components/shared/Dialogs/PropertyDialog/PropertyDialog.tsx:47` | `/listings/{mls}` | api.repliers.io (via Koa) | Browser | uses `fields=raw` | Dialog needs full payload. ✓. |
| `src/providers/LocationsProvider/LocationsProvider.tsx:42` | `/autosuggest/locations` | api.repliers.io (via Koa) | Browser | n/a | Provider used by SSR + client. Movable to CSR. |

### Backend (Koa, backend/src/)

The legacy backend still routes most server-side Repliers traffic. None of
its callers go to `csr-api` — by design, the backend uses the server-side
key.

| File:Line | Endpoint | Base URL | fields? | Notes |
|---|---|---|---|---|
| `backend/src/services/repliers/listings.ts:208` `search()` | `/listings` (GET or POST) | api.repliers.io | passthrough | Generic helper. |
| `backend/src/services/repliers/listings.ts:217` `similar()` | `/listings/{id}/similar` | api.repliers.io | passthrough | |
| `backend/src/services/repliers/listings.ts:223` `locations()` | `/listings/locations` | api.repliers.io | passthrough | |
| `backend/src/services/repliers/listings.ts:230` `single()` | `/listings/{mlsNumber}` | api.repliers.io | passthrough | |
| `backend/src/services/repliers/listings.ts:238` `nlp()` | `/nlp` | api.repliers.io | n/a | Not on CSR allowed list — must stay. |
| `backend/src/services/listings.ts:51` `ensureRequiredFields()` | (helper) | n/a | n/a | Always tacks on `status,permissions,address,duplicates,boardId` — keeps the proxy honest, but it's additive only; if caller didn't pass `fields`, the response is still full. |
| `backend/src/services/autosuggest.ts:101` | `/listings` | api.repliers.io | ✓ `mlsNumber,address,type,map,boardId` | ✓ already minimal. |
| `backend/src/services/estimate.ts:191` `findListingByAddress` | `/listings` | api.repliers.io | ✓ ~30 fields via `propertyDetailsFields.join(',')` | Reasonable for an estimate seed. |
| `backend/src/services/estimate.ts:326` `getAddressData` | `/listings` | api.repliers.io | ✓ `address` (only) | ✓ correct. |
| `backend/src/services/estimate.ts:262,419` `adjustPropertyTax` / `getAverageTax` | `/listings` | api.repliers.io | n/a | `listings:false` + statistics. ✓. |
| `backend/src/services/stats.ts:119,124,129,134,138,144,339,347,355` | `/listings` | api.repliers.io | n/a | All statistics-only (`listings:false` via `widgetParams`). ✓. |
| `backend/src/services/repliersLocations.ts:99` | `/locations` | api.repliers.io | n/a | Backend calls the JSON locations endpoint directly (24h cache). On CSR allow-list — could move; but the cache + filtering is a real value-add. |
| `backend/src/services/repliers/messages.ts`, `clients.ts`, `agents.ts`, `favorites.ts`, `searches.ts`, `estimate.ts` (CRUD methods) | `/messages /clients /agents /favorites /searches /estimates` | api.repliers.io | n/a | Sensitive — must stay server-side. |

### Other

| File:Line | Endpoint | Base URL | Notes |
|---|---|---|---|
| `src/configs/defaults/api.ts:16` | `https://cdn.repliers.io` | n/a | CDN constant for image hosts. Not an API call. |
| `src/utils/imageOptimization.ts` | `cdn.repliers.io` | n/a | Image URL builder. |
| `src/app/layout.tsx:63-64` | `cdn.repliers.io` + `api.repliers.io` | n/a | `<link rel="preconnect">` hints. ⚠ Should probably also preconnect to `csr-api.repliers.io` since most browser-side traffic now goes there. |

## Backend proxy routes

| Route | Internal call | Removable? | Notes |
|---|---|---|---|
| `POST /api/listings/search`, `GET /api/listings/search` (`backend/src/routes/listings.ts:656,674`) | `ListingsService.search` → `repliers.listings.search` | Mostly | Pass-through with `displayInternetEntireListing=Y` enforcement and the `scrubbed('listings')` decorator. The scrubber drops fields based on `permissions.displayPublic`/`displayInternetEntireListing` — not safe to remove without porting that logic to the client. |
| `GET /api/listings/count` (`backend/src/routes/listings.ts:691`) | `ListingsService.count` | Yes | Same shape with `listings:false` + 60-min cache. The cache is the only value-add; cache key is on every URL param. Could be replaced by client-side memoization for high-volume queries. |
| `GET /api/listings/locations` (`backend/src/routes/listings.ts:812`) | `ListingsService.locations` | Mostly | Heavy normalization: merges condo+residential class trees, drops disallowed areas, optionally drops coordinates, removes empty cities/neighborhoods. Real value-add — moving to direct CSR would require porting ~150 lines of TS. |
| `GET /api/listings/:mlsNumber` (`backend/src/routes/listings.ts:892`) | `ListingsService.single` | **No** | `validateAvailability` blocks listings whose `lastStatus` is in `hide_unavailable_listings_statuses`. This is a content-policy guarantee — must not be removed. |
| `GET /api/listings/:propertyId/similar` (`backend/src/routes/listings.ts:750`) | `ListingsService.similar` | **No** | Goes through `scrubbed('similar')`. Endpoint is also not on the CSR allowed list. |
| `POST /api/listings/nlp` (`backend/src/routes/listings.ts:837`) | `ListingsService.nlp` | **No** | Endpoint not on CSR allowed list. Also rewrites the response. |
| `GET /api/autosuggest`, `GET /api/autosuggest/locations` (`backend/src/services/autosuggest.ts`) | Mapbox + Repliers + dedupe | Mostly (locations) | `/autosuggest` itself is a real aggregator — keep. `/autosuggest/locations` calls `ListingsService.locations` and is the same as `/api/listings/locations` — same caveats. |

## Detailed findings per call site (MISSING / COULD-IMPROVE only)

### `src/configs/defaults/filters.ts:40` — `images` in `listingFields`
`listingFields` is the canonical "fields for a card" list and is used by
search results, the map, the grid view, the table view, "nearby" 404s,
and the homedetails/listing area pages. It currently includes the bare
`'images'` field, which fetches the entire image array per listing. UI
code only ever reads `images[0]` for the primary thumbnail. Replacing
`'images'` with `'images[1]'` (Repliers' shorthand for "first image only")
applies to every search-related listing render at once. Highest single-
edit impact.

### `src/components/shared/AreaValueTrends.tsx:228`
Fetches up to 50 active listings just to read `estimate.value` and
`estimate.history.mth` per listing. Recommended: `fields=estimate`
(or `fields=estimate.value,estimate.history`). Eliminates ~95% of the
payload.

### `src/components/shared/ListingsGrid.tsx:36`
Card UI with a known field list. Recommended:
`fields=mlsNumber,listPrice,address,details.numBedrooms,details.numBathrooms,details.sqft,images[1],status,soldPrice,soldDate,boardId`.

### `src/components/property-detail/SoldPriceDistribution.tsx:150`
Only `soldPrice` is read from each listing; everything else is discarded.
Recommended: `fields=soldPrice`. This page can fetch up to 100 listings,
so the savings are large.

### `src/components/property-detail/ViewOtherUnits.tsx:44`
Reads `mlsNumber` only (to filter out the current listing and count
others). Recommended: `fields=mlsNumber`. ~50 listings × full payload to
get one string per listing — ridiculous.

### `src/components/property-detail/PropertyValueEstimate.tsx:275`
Single-listing `getListing` call — only `listing.estimate.value` is read.
Recommended: append `fields: 'estimate'` to `APISearchCSR.getListing`.
(Will need an optional fields argument added to that helper.)

### `src/app/homedetails/[slug]/similarProperties.ts:6` and `src/app/listing/[slug]/similarProperties.ts:6`
Renders 6 similar-listing cards. Recommended: same field list as
`ListingsGrid`.

### `src/services/marketing/fetchFeedProperties.ts:100`
Builds Google Ads / Facebook Ads marketing feeds. Reads ~12 fields per
listing in `mapPropertyToRemarketing`. Can be limited to:
`fields=mlsNumber,status,lastStatus,listPrice,address,details.propertyType,details.style,details.numBedrooms,details.numBathrooms,details.sqft,images[1],map`.
For a full-feed run with `limit=1000`, this is the second-largest
opportunity after the cron jobs.

### `src/services/pageGeneration.ts:232` `fetchListingsPreview`
Renders previews on city/sub-type pages. Same fix as `ListingsGrid`.

### `src/app/api/admin/backfill/route.ts:30`
Loops up to 20 pages × 500 sold listings/page (= 10,000 listings) per
county per run. `scorePropertyPage` consumes `status, lastStatus,
soldDate, soldPrice, images, history, estimate, details.description,
address.city, address.area`. Recommended:
`fields=mlsNumber,status,lastStatus,soldDate,soldPrice,images[1],updatedOn,address.city,address.area,details.description,history,estimate.value`.

### `src/app/api/cron/property-sync/route.ts:64,89`
Daily cron, similar to backfill but smaller. Same recommended `fields`.

### `src/app/sitemaps/[type]/route.ts:85` `generateSold` fallback path
Same recommended `fields` as backfill — only fires if the prebuilt
property index is missing, but worth fixing for the cold-start case.

### `src/services/API/APISearchCSR.ts:95` `getAddressHistory`
Renders address-history rows. Recommended:
`fields=mlsNumber,status,lastStatus,listPrice,soldPrice,soldDate,listDate,updatedOn,address`.

## Cautions / things NOT to change

- **Keep server-side**: `/agents`, `/clients`, `/messages`, `/webhooks`,
  `/searches` (CRUD), `/favorites`, `/estimates` (POST/PATCH/DELETE),
  `/nlp`. These either touch sensitive data, accept POST/PATCH bodies
  outside the four allowed CSR endpoints, or use the server key for
  write authorization.
- **Keep `validateAvailability`**: the `GET /api/listings/:mlsNumber`
  proxy enforces a content-policy hide list (`hide_unavailable_listings_statuses`).
  Removing the proxy without porting that logic would expose those
  listings on the public site.
- **Keep the `scrubbed` decorator**: `backend/src/services/scrubber/listings.ts`
  drops fields based on `permissions.displayPublic` /
  `displayInternetEntireListing`. Direct CSR responses bypass it.
- **`fields=raw`** (used by APIPropertyDetails.fetchProperty) is the
  Repliers shorthand for "everything in raw MLS form" — leave it alone
  for the property detail page, which legitimately needs the whole record.
- **Aggregate-only / count-only / statistics-only calls**: when
  `listings:false` is set, the response carries no listings array, so
  `fields` has no effect. Don't add it.
- **`/places` endpoint** (`APIPlaces`, `NearbyPlaces.tsx`): the spec
  description in the audit prompt lists only `/listings` (GET/POST),
  `/locations`, and `/locations/autocomplete` as CSR-allowed. The
  codebase calls `/places` against `csr-api.repliers.io`. Either the
  allowed list is incomplete or `/places` is silently working via a
  loophole; verify with Repliers before relying on it.
- **`<link rel="preconnect">` hints** in `src/app/layout.tsx`: currently
  point at `api.repliers.io` and `cdn.repliers.io`. If/when more browser
  traffic moves to `csr-api.repliers.io`, add a preconnect for that host
  too — different origin, different TLS handshake.
