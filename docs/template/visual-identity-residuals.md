# Visual Identity — Residual Hardcoded References

After the visual-identity centralization commit, most visual identity reads from
`src/configs/tenant.config.ts` (the `visualIdentity` block). This document
catalogues every spot that's still hardcoded and requires manual editing to
fully rebrand the site.

## What's already config-driven

Editing `tenant.visualIdentity` in `src/configs/tenant.config.ts` cascades to:

- The MUI palette (`src/configs/defaults/colors.ts` → `theme/palette.ts`) — every
  `theme.palette.primary.main`, `theme.palette.error.main`, etc. consumer across
  the entire MUI tree (buttons, links, chips, alerts, form fields, etc.).
- Header background (`src/components/templates/components/Header/Header.tsx`).
- Footer background (`src/components/templates/components/Footer/Footer.tsx`).
- Logo: header, mobile, footer (`src/configs/defaults/content.ts`).
- Splashscreen / login splash image (`src/configs/defaults/content.ts`).
- Homepage hero gradient fallback (`src/components/pages/home/components/HeroSection.tsx`).
- OG image generators (`src/app/api/og/{city,property}/route.tsx`) — backgrounds,
  accent gold, muted text, font family.
- MUI typography font family (`src/configs/defaults/theme/typography.ts`).

## Residual hardcoded references

These touchpoints are still hardcoded. To fully rebrand, edit each location.

### Chrome / structural

| File | Line(s) | Value | Why hardcoded |
|---|---|---|---|
| `src/styles/globals.css` | 4, 16 | `background: white` | Top-level `<body>`/`<html>` background — change manually if non-white surface needed |
| `src/app/layout.tsx` | 36 | `themeColor: 'white'` | Browser chrome theme color (PWA / mobile address bar) |

### Logo / asset replacements

To swap the logo or hero artwork, replace these files in `public/` (the paths
are referenced by `tenant.visualIdentity.logo` and `tenant.visualIdentity.heroImages`):

- `public/logo.svg` — header logo
- `public/logo-footer.svg` — footer logo
- `public/splashscreen.webp` — login + splash hero image
- `public/favicon.ico` — browser tab favicon (also referenced in
  `src/configs/defaults/content.ts → siteMetadata.icons`)
- `public/apple-touch-icon.png` — iOS bookmark icon
- `public/og-image.jpg` and `public/twitter-image.jpg` — static OG fallbacks
  (referenced in `src/configs/defaults/content.ts → siteMetadata.openGraph` and
  `siteMetadata.twitter`)

### Component-level hardcoded hex colors

These mostly belong to chart palettes, mortgage/cashflow calculators, market
trend graphs, and similar data-viz components where colors encode meaning
(red = down, green = up, etc.) rather than brand identity. They are intentionally
left alone because rebranding a chart's "down" color to brand-red would destroy
its semantic meaning. To fully theme them, edit the files individually.

Approximate count by directory (run `grep -rE "#[0-9a-fA-F]{6}\b" src` for the
authoritative live list):

| Directory | Files w/ hardcoded hex | Notes |
|---|---|---|
| `src/components/sidebar/` | ~12 | Sidebar widget accents |
| `src/components/property-detail/` | ~10 | Charts, graphs, calculators |
| `src/components/shared/MarketTrends/` | 3 | Chart colors |
| `src/components/shared/Stats/`, `Photos/`, `Map/` | ~5 | Misc UI accents |
| `src/components/shared/Property/Card/` | ~4 | Property card styling |
| `src/components/templates/components/_baker-re/` | ~5 | Alternative footer template (white-label variant) |
| `src/services/marketing/dataLayer.ts` | 1 | Analytics-only color, irrelevant to UI |
| `src/hooks/useAnalytics.ts` | 2 | Analytics-only |

### Specific deliberate residuals

| File | Line | Value | Reason |
|---|---|---|---|
| `src/components/pages/estimate/EstimateFormSteps/Step0Embedded.tsx` | ~78 | `/JUSTIN-logo.svg` | Hard-coded white-label logo for Justin Havre variant — gated by tenant flag elsewhere |
| `src/configs/defaults/colors.ts` | `light`, `black` | `#999999`, `#202020` | Generic neutrals, not brand identity |
| `src/configs/defaults/colors.ts` | `chartColors`, `inventoryColors` | `[secondary, lighten(primary,0.5), success]` etc. | Already derive from tenant primary/secondary/success — would only need editing for charts that need different hues |

### CSS-in-JS computed values

A few components apply `darken()` / `lighten()` from MUI to brand colors at
runtime — these all derive from `tenant.visualIdentity.colors.primary` and
update automatically:

- `src/configs/defaults/colors.ts` — `soldMarker`, `rentMarker`, chart colors
- `src/configs/defaults/theme/palette.ts` — every palette swatch's `light`/`dark` variant

## To rebrand the site fully

1. Edit `src/configs/tenant.config.ts` → `visualIdentity` block (covers ~80% of
   visible surface area).
2. Replace logo + favicon + splashscreen + OG fallback files in `public/`
   (see "Logo / asset replacements" above).
3. If you want a different display font, swap `Montserrat` in `src/app/layout.tsx`
   for another `next/font/google` import, then update
   `tenant.visualIdentity.fonts` to match the new CSS variable name.
4. Audit the chart/data-viz hex codes if you want fully on-brand graphs (see
   "Component-level hardcoded hex colors" — most users skip this and accept
   the existing semantic palette).
5. If using the Baker RE white-label variant
   (`src/components/templates/components/_baker-re/`), edit those template
   files separately — they are a parallel branded variant and not driven by
   the main tenant config.
6. Update `backend/src/config/tenant.config.ts` to mirror any backend-relevant
   brand fields.

## How to verify

After rebranding, smoke-test these surfaces:

1. Header / Footer visible on every page.
2. Homepage hero (`/`).
3. Property detail page (`/homes/...`).
4. City landing page (`/[city-slug]`).
5. OG images (`/api/og/city?slug=...` and `/api/og/property?slug=...`).
6. Login splash, About, Contact, Sell, Home Value pages.
7. MUI Buttons, links, form fields — all derive from theme.palette.
