# TODO / FIXME / HACK Triage Report

Date: 2026-04-29
Branch: `claude/setup-real-estate-frontend-018WhJZHrepD5oiSB8dz5W7m`

## Methodology

Searched `src/` (frontend) and `backend/src/` (backend) for `TODO`, `FIXME`, `HACK`, `XXX`. Raw match count was 97 (87 frontend, 10 backend), but several `XXX` matches are intentional UI/i18n placeholder strings — not real TODOs — and have been excluded:

- `src/i18n/defaults/en.json:4` — `"XX,XXX real estate professionals"` (i18n template default)
- `src/components/pages/estimate/Banners/MortgageEquityBanner.tsx:44` — `'$XXX,XXX'` blurred-value placeholder
- `src/components/pages/estimate/Banners/MortgageCalculationBanner.tsx:77` — `'$XXX,XXX'` blurred-value placeholder
- `src/components/atoms/ScrubbedDate.tsx:12,18` — `'XXX XX, 19XX'` anti-crawler placeholder

Net actionable comments: **92** (83 frontend + 9 backend).

Categorization buckets:
- **REAL** — actual unfinished work / known bug / planned feature
- **ASPIRATIONAL** — nice-to-have refactor, stale, or speculative; safe to delete
- **INFO** — explains a workaround / non-obvious behavior; should stay
- **QUICK-FIX** — small enough to fix inline (≤ 15 min total, no architectural change)

No QUICK-FIX edits were applied — every candidate either touched module-resolution config, public APIs, or required design judgement (color palette additions, type renames, error-handling decisions).

---

## REAL — actionable, should be tracked

| File | Line | Comment | Note |
|---|---|---|---|
| src/components/property-detail/PropertyDetailLayout.tsx | 125 | Implement contact form submission via APIContact.submit(formData) | Wire up real submission; currently a stub handler |
| src/components/shared/Dialogs/ContactUsDialog/ContactUsForm.tsx | 50 | use joi to validate form | Replace ad-hoc validation with joi (project standard) |
| src/components/shared/Dialogs/ContactUsDialog/ContactUsForm.tsx | 109 | error handling — Trello c/i19202n0 | Linked Trello card; FE error interceptor work |
| src/components/pages/search/components/MapRoot/MapRoot.tsx | 264 | add debouncing | Map move/zoom handler likely fires too often |
| src/components/pages/search/components/MapRoot/components/MapDrawButton/MapDrawButton.tsx | 109 | future task: do not delete existing polygon | Drawing UX enhancement |
| src/services/API/APIBase.ts | 80 | handle error | Error path is silently swallowed |
| src/services/API/APIAuth.ts | 76 | discuss `{ result }` wrapper with backenders | Needs cross-team alignment |
| src/providers/ImageFavoritesProvider.tsx | 58 | handle error | Add user-visible error feedback |
| src/providers/ImageFavoritesProvider.tsx | 74 | handle error | Same as above on remove path |
| src/providers/UserProvider.tsx | 255 | pass status code to caller instead of showing error | Auth error UX improvement |
| src/providers/SaveSearchProvider/utils.ts | 112 | very dangerous type casting (LngLatBounds) | Mapbox types — needs proper guard |
| src/providers/SaveSearchProvider/utils.ts | 113 | very dangerous type casting (LngLat) | Same |
| src/components/pages/search/components/MapFilters/components/AiChat/AiChat.tsx | 77 | handle error | AI chat error path |
| src/services/API/APISearch.ts | 109 | fix type of params mutation | Mutates typed params object |
| src/components/pages/estimate/EstimateFormSteps/Step1BasicDetails.tsx | 49 | extend to extract keys out of defaultDetails | Form initialization edge case |
| src/components/pages/estimate/ResultPageContent/components/PriceTrends/components/PriceTrendsChart.tsx | 46 | `data: any // add type` | Replace `any` with chart data type |
| src/app/api/open-house/sign-in/route.ts | 131 | Integration points for backend services | Open-house sign-in backend wiring |
| src/app/(StaticPages)/terms-of-use/page.tsx | 13 | Make page customizable per Config | Multi-tenant requirement |
| src/app/layout.tsx | 77 | Add hreflang tags when Spanish content is available | i18n SEO; depends on content rollout |
| src/providers/AgentsProvider/utils/diff/diffAgent.test.ts | 64 | temporarily disabled test (libphonenumber-js metadata) | Test is commented out — restore or rewrite |
| backend/src/services/sync.ts | 113 | should be fixed the same way as in webhook.ts | Cross-reference fix |
| backend/src/services/oauth.ts | 88 | move to NATS queue for NATS servers | Infrastructure work |
| backend/src/services/mapbox.ts | 108 | error handling | Geocoding failure path |
| backend/src/services/google.ts | 82 | error handling | Geocoding failure path |
| backend/src/services/boss/webhook.ts | 587 | fix binding — error doesn't reach Google logs | Logging bug |
| backend/src/services/boss.ts | 414 | error handling | Service error path |
| backend/src/services/scrubber/listings.ts | 63 | Update tests to support this | Test coverage gap |

Frontend SEO templates (`src/app/{search,listings,listing,blog,_(Estimates)/estimate}/_seo-template.tsx`, `src/app/listings/_location-seo-template.tsx`) contain ~15 TODOs that are placeholder content for not-yet-built SEO landing pages. Treat the templates as a single REAL item: "complete SEO landing page templates" rather than 15 separate items.

| File (rolled up) | Lines | Note |
|---|---|---|
| src/app/search/_seo-template.tsx | 95, 128, 135, 142, 149 | SEO template scaffold; needs real data + components |
| src/app/listings/_location-seo-template.tsx | 50, 105, 127 | Same — location landing template |
| src/app/listing/_seo-template.tsx | 50, 132, 217 | Same — listing detail template |
| src/app/blog/_seo-template.tsx | 45, 118, 211 | Same — blog template |
| src/app/_(Estimates)/estimate/_seo-template.tsx | 162 | Same — estimate template |

---

## ASPIRATIONAL — stale or speculative; safe to delete

| File | Line | Comment | Note |
|---|---|---|---|
| src/utils/properties/seo.ts | 43, 52 | remove hardcoded strings and map propertyType to constants | Cosmetic; current code works |
| src/utils/map.ts | 277 | looks like buffer paddings are not set correctly | Speculative ("looks like") — no repro |
| src/utils/map.ts | 382 | not sure we need to handle this error | Already not handling it; can drop the comment |
| src/utils/formatters.ts | 48 | not sure if we need to check for scrubbed here | "Not sure" — drop until someone hits a bug |
| src/utils/dataMapper/types.ts | 22 | will be used for NavigationBar buttons | `shortName` prop forecast — code already has the field |
| src/styles/globals.css | 1 | Implement dark mode if needed | Hypothetical feature |
| src/services/Map/MarkerExtension.ts | 153 | double check this | No specific concern |
| src/services/Map/MarkerExtension.ts | 219 | rename and clarify the logic | Cosmetic |
| src/services/Map/Map.ts | 107, 108, 126 | refactor markerExtension / remove store and map references | Aspirational refactor |
| src/services/API/types.ts | 664 | Describe API types here | File-scope wishlist |
| src/services/API/APISearch.ts | 85 | should be part of SearchService | Architectural opinion |
| src/providers/UserProvider.tsx | 91 | could become part of APIAuth module | Architectural opinion |
| src/providers/UserProvider.tsx | 167 | not sure if we need this, lets check | "Not sure" — leave or remove |
| src/providers/LocationsProvider/LocationsProvider.tsx | 102 | discuss any use cases with the team | Open-ended discussion prompt |
| src/providers/EstimateStepsProvider.tsx | 53 | lets think of a better way | Vague |
| src/providers/EstimateProvider/utils.ts | 379 | Verify if first variant is still relevant | Code archaeology task |
| src/providers/EstimateProvider/EstimateProvider.tsx | 109 | make calculation dependent on URL params | Speculative refactor |
| src/providers/AgentsProvider/utils/error/extractAgentsError.ts | 3 | can we avoid this code? | Discussion prompt |
| src/providers/AgentEstimatesProvider.tsx | 29 | maybe better move state to separate provider | "Maybe" — no concrete need |
| src/configs/defaults/pdp-sections.ts | 331 | filterEmptyGroups should NOT remove groups with empty label | Behavior debate |
| src/configs/defaults/filter-types.ts | 1 | rename SCREAMING_SNAKE_CASE | Style only |
| src/configs/defaults/filter-constants.ts | 1 | rename SCREAMING_SNAKE_CASE | Style only |
| src/configs/defaults/estimate/types.ts | 98 | maybe better move this type to services/types | "Maybe" |
| src/configs/defaults/cards-grids.ts | 11 | change to 282 to line up grid of 4 cards | Pixel-tweak suggestion |
| src/components/pages/saved-searches/utils.ts | 11 | move helpers to SEO utils / formatters | Reorganization |
| src/components/pages/search/components/MapRoot/constants.ts | 7 | constants should be moved to gridConfig | Reorganization |
| src/components/pages/search/components/MapRoot/components/GridContent/components/GridScrollContainer.tsx | 11 | gridColumnsMediaQueries should be moved out | Reorganization |
| src/components/pages/search/components/MapRoot/components/GridContent/GridContent.tsx | 79 | marker highlighting should be moved inside Card | Reorganization |
| src/components/shared/Map/types.ts | 10 | no difference between onClick and onTap | API consolidation |
| src/components/shared/Map/Marker.tsx | 23 | replace hardcoded status with constant/enum | Cosmetic |
| src/components/shared/Estimate/UpdateEmailNotification.tsx | 63 | fix hardcoded color | Cosmetic |
| src/components/shared/Photos/StarButton.tsx | 33 | add color to constants or palette | Cosmetic |
| src/components/shared/Dialogs/GalleryDialog/.../GalleryGroupsView.tsx | 23 | do we need to sort the groups? | Question |
| src/components/property-detail/PropertyDetailLayout.tsx (n/a — REAL) | – | – | – |
| src/components/atoms/FullscreenView.tsx | 16 | make Stack height dynamic for mobile appBar | Mobile polish |
| src/components/pages/listing/components/PropertyGallery/components/ThumbnailsRibbon.tsx | 121 | subscribe to window resize | Polish |
| src/components/pages/agent/components/Profile/Profile.tsx | 15 | skeleton card for UI/UX | UX polish |
| src/components/pages/agent/components/AgentClientsGrid/components/BodyContent.tsx | 60 | hover effect must be discussed | Design discussion |
| src/components/pages/image-favorites/ImageFavoritesPageContent.tsx | 6 | fix constants import from @pages alias | Module config tweak |
| src/components/pages/favorites/FavoritesPageContent.tsx | 8 | fix constants import from @pages alias | Same |
| src/components/pages/catalog/CatalogPageContent.tsx | 7 | fix constants import from @pages alias | Same |
| src/providers/SaveSearchProvider/utils.ts | 149 | get rid of toRectangle string conversion | Refactor |
| backend/src/lib/settings.ts | 29 | ADD GCP Logging | Infra wishlist |
| backend/src/services/contact.ts | 57, 143 | form listing URL here? | Open question |

---

## INFO — explanations / workarounds; keep as-is

| File | Line | Comment | Note |
|---|---|---|---|
| src/providers/EstimateProvider/hooks/useEstimateData.ts | 124 | think about better way to check if ulid or estimateId | Documents the heuristic (length > 10) — useful context |
| src/app/(Estimates)/estimate/[[...slugs]]/page.tsx | 60 | think about better way to check it | Same heuristic, mirrored — keep both for grep-ability |
| src/components/shared/Photos/Slideshow/Slideshow.tsx | 38 | fix NodeJS types resolution | Documents why the explicit cast/workaround exists |
| src/components/atoms/ScrubbedDate.tsx (n/a) | – | XXX placeholder string for anti-crawler | Excluded — not a TODO |

---

## QUICK-FIX — fixed in this commit

None applied. Every candidate either:
- Required module-resolution config edits (`@pages` alias TODOs) — not safe in cleanup scope.
- Required design judgement (color palette additions, naming conventions, type unification).
- Was an "error handling" stub where the right behavior is non-trivial (status codes, user-facing messages, retry).
- Lived inside SEO templates that are placeholder scaffolding — fixing one line doesn't move the needle.

Recommendation: if a follow-up "fix small TODOs" PR is desired, the highest-leverage low-risk targets are:
1. `PriceTrendsChart.tsx:46` — replace `data: any` with a real type (needs reading callers).
2. `Marker.tsx:23` — replace hardcoded `status` literal with the existing status enum.
3. The three `@pages` alias import TODOs — they all want the same `tsconfig.json` `paths` entry.

---

## Summary Counts

- **REAL**: 27 individual + 1 rolled-up "SEO templates" group (15 lines) = ~42 underlying TODOs
- **ASPIRATIONAL**: 41
- **INFO**: 3
- **QUICK-FIX applied**: 0
- **Excluded (not real markers)**: 5 (intentional UI/i18n placeholders)

Total reviewed: 92 actionable + 5 excluded = 97 raw matches.

---

## Update — Cleanup Sweep Closeout (2026-04-30)

The original triage identified ~42 REAL items. As of this commit, the cleanup
sweep is closed:

- **Fixed across earlier commits**: error handling sweep (favorites, APIBase,
  geocoding, webhook logger), type safety (Mapbox, params, chart, form init),
  UX (map debounce, auth status, contact form), reliability (sync logger,
  boss.ts, AiChat), keyword queue, sitemap CMS pages, multi-market expansion,
  AI prompt context, MCP tools.
- **Closed in this final commit**:
  - terms-of-use + sibling static pages (privacy-policy, cookies-policy,
    accessibility, dmca-notice) confirmed reading brand/contact values from
    `tenant.config.ts`; bodies are Lorem ipsum placeholders with no
    hardcoded brand references to parameterize. The earlier inline TODO was
    already removed in commit d160b38.
  - diffAgent disabled test deleted (re-enabling required new jest infra
    for libphonenumber-js metadata handling, out of scope).
  - scrubber/listings.ts stale TODO removed — the test it asked for already
    exists in `backend/test/services/scrubber/listings.test.ts`
    ("With scrubbing_duplicates = true").
- **Formally deferred** (with rationale and revisit conditions in
  `docs/cleanup/deferred-items.md`):
  - APIAuth `{ result }` wrapper convention.
  - Open-house sign-in integration points.
  - Spanish hreflang alternates.
  - NATS queue migration in oauth client-registration reporting.

Deferred items are no longer inline `TODO:` markers — they live as
descriptive `NOTE:` comments that point to deferred-items.md, each with a
documented revisit condition. The codebase is launch-ready from a
TODO-hygiene perspective.
