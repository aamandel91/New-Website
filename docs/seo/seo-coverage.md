# SEO Coverage by Page Type

Working reference for the JSON-LD schemas, metadata, and on-page SEO patterns
the live site emits per route. All brand strings come from
`src/configs/tenant.config.ts`; all market geography comes from
`src/configs/defaults/page-generation.ts`. Never hardcode either.

---

## City landing pages — `/{city}` (e.g. `/fort-lauderdale`)
- Source: `src/app/[...slugs]/page.tsx` → `renderCityPage`
- Metadata: title (with listing count + year), description, canonical, robots
  (index/noindex via `scoreAreaPage`), openGraph + Twitter card with dynamic
  OG image at `/{city}/opengraph-image`.
- JSON-LD: `BreadcrumbList`, `LocalBusiness`, `FAQPage` (4 city-aware
  questions about pricing, market quality, buying timeline, neighborhoods).
- Body: H1 with city + listing count, market timeline graph, neighborhoods
  grid, ZIP chips, sub-type chips, "nearby cities" silo from market config.

## City + sub-type pages — `/{city}/{subtype}` (e.g. `/fort-lauderdale/condos`)
- Source: `src/app/[...slugs]/page.tsx` → `renderSubTypePage`
- Metadata: title via `generateMetaTitle`, dynamic description, canonical,
  robots, OG image at `/{city}/{subtype}/opengraph-image`.
- JSON-LD: `BreadcrumbList`, `FAQPage` (4 sub-type-aware questions).
- Body: H1 from `generateHeadingVariations`, listings grid filtered by
  property type, market timeline, "more in {city}" sub-type chips.

## City neighborhood pages — `/{city}/{neighborhood}`
- Source: `src/app/[...slugs]/page.tsx` → `renderNeighborhoodPage`
- Metadata: title, description, canonical (implicit at /{city}/{neighborhood}),
  robots, OG image.
- JSON-LD: `BreadcrumbList`.
- Body: H1, listings grid filtered by neighborhood, market timeline, area
  value trends.

## City ZIP pages — `/{city}/{zip}`
- Source: `src/app/[...slugs]/page.tsx` → `renderZipPage`
- Metadata: title (with listing count + year + ZIP), description, robots,
  OG image.
- JSON-LD: `BreadcrumbList`.
- Body: H1 with city + ZIP, listings grid filtered by ZIP, market timeline.

## City schools pages — `/{city}/schools`
- Source: `src/app/[...slugs]/page.tsx` → `renderSchoolsPage`
- Metadata: title, description, robots, OG image.
- JSON-LD: `BreadcrumbList`.
- Body: H1, placeholder copy (school data integration is future work).

## CMS-backed content pages (any matching slug)
- Source: `src/app/[...slugs]/page.tsx` → `renderCmsPage`
- Metadata: same dynamic generators as the equivalent dynamic page type.
- JSON-LD: `BreadcrumbList`. If `page.structured_data` is present in the
  CMS record it is emitted verbatim as an additional `<script>`.
- Body: title + ordered content modules (`text` rendered as HTML).

## Property detail pages (PDP) — `/listing/{slug}` and `/homes/{slug}`
- Source: `src/app/listing/[slug]/page.tsx`
  (`/homes/{slug}` mounts the same component via routing).
- Metadata: from `formatMetadata(property, host)`; canonical points at the
  permanent `/homes/` URL via `generateStaticPropertyUrl`.
- OG image: dynamic at `src/app/homes/[slug]/opengraph-image.tsx`.
- JSON-LD: `RealEstateListing` (full schema with `@id`, `Offer` price/
  availability, `PostalAddress`, `floorSize`, photos as `ImageObject[]`,
  MLS number as `identifier`/`productID`) and `BreadcrumbList`. Both come
  from `src/utils/propertySchema.ts`.

## Catalog/listings pages — `/listings` and `/listings/{slugs...}`
- Source: `src/app/listings/[[...slugs]]/page.tsx`
- Metadata: via `generateCatalogMetadata`; if a listing ID is in the slug,
  delegates to PDP metadata.
- JSON-LD: `BreadcrumbList`; `LocalBusiness` when a city is in the URL.
- Body: catalog page content (filters + listing grid).

## Search pages — `/search/{layout}` (`map` | `gallery` | `grid` | `table`)
- Source: `src/app/search/[layout]/page.tsx`
- Metadata: dynamic title/description from `searchParams` (location,
  bedrooms, price range, propertyType). **Robots: noindex/follow** when any
  filter is present (filtered combos are duplicates of the canonical city
  landing pages); index/follow only on the bare layout. Canonical points
  at `/search/{layout}` to collapse all filter combos.
- JSON-LD: `BreadcrumbList`.

## Blog index — `/blog`
- Source: `src/app/blog/page.tsx`
- Metadata: from blog index page module.

## Blog post pages — `/blog/{slug}`
- Source: `src/app/blog/[slug]/page.tsx`
- Metadata: title (`meta_title || title`), description, keywords, canonical,
  openGraph (`type: article`, `publishedTime`, `modifiedTime`, `authors`,
  `tags`, image), Twitter card.
- JSON-LD: `BlogPosting` (with `Person` author, `datePublished`,
  `dateModified`, image, articleBody) and `BreadcrumbList`.
- Body: article content + related articles section.

## Estimate landing — `/estimate`
- Source: `src/app/(Estimates)/estimate/[[...slugs]]/page.tsx`
- Metadata: from `content.estimateMetadata` plus canonical
  (`{siteUrl}/estimate`), openGraph, Twitter card.
- JSON-LD: `BreadcrumbList`, `FAQPage` (5 valuation FAQs about how the
  tool works, accuracy, time, cost, required info). Emitted only on the
  landing/intro state — result pages skip them since they have per-property
  metadata of their own.
- Body: estimate form wrapper.

## Estimate result — `/estimate/{...estimateId}`
- Source: same file.
- Metadata: `generateResultMetadata` substitutes the property's short
  address into the configured title/description templates.
- JSON-LD: none (per-property page; relies on metadata only).

## Static pages — `/privacy-policy`, `/terms-of-use`, `/cookies-policy`,
## `/accessibility`, `/dmca-notice`
- Source: `src/app/(StaticPages)/{page}/page.tsx`
- Metadata: title, description, canonical, robots: index/follow,
  openGraph + Twitter card. All copy reads from tenant config.
- JSON-LD: `BreadcrumbList` (Home → Page).
- Body: rendered Markdown.

## About page — `/about`
- Source: `src/app/about/page.tsx`
- See commit cdc4529 — has full SEO treatment (metadata, JSON-LD).

## Sitemap — `/sitemap.xml`
- Source: `src/app/sitemap.ts`
- Includes published CMS pages with revalidation (commit b68ae7a).

---

## Shared utilities
- `src/utils/structuredData.ts` — `organizationSchema`, `propertySchema`
  (legacy; PDPs use `propertySchema.ts` instead), `agentSchema`,
  `articleSchema`, `breadcrumbSchema`, `localBusinessSchema`,
  `websiteSearchSchema`, `faqSchema`.
- `src/utils/propertySchema.ts` — `generatePropertyJsonLd`,
  `generatePropertyBreadcrumbJsonLd` (richer RealEstateListing schema for
  PDPs).
- `src/components/shared/StructuredData` — emits a `<script type="application/ld+json">`
  tag with the supplied object.
