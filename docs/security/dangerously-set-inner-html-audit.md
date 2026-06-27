# `dangerouslySetInnerHTML` audit

**Date:** 2026-06-27
**Total sites:** 12
**Status:** 9 safe, 3 need follow-up

`dangerouslySetInnerHTML` bypasses React's default XSS protection. Every use
should be either (a) injecting a string the developer fully controls, or
(b) sanitizing user-controlled input before injection.

## Classification

### ✅ Safe — developer-controlled strings, no user input

| File | What it injects | Notes |
|---|---|---|
| `src/app/layout.tsx:97` | Service-worker registration boilerplate. | Static string literal. |
| `src/components/analytics/GoogleTagManager.tsx:13` | GTM init snippet. | Static, `GTM-XXXX` ID from env. Standard Google pattern. |
| `src/components/analytics/RemarketingPixels.tsx:13` | Meta Pixel snippet. | Static. Standard Meta pattern. |
| `src/components/analytics/SureSendPixel.tsx:12` | SureSend pixel snippet. | Static. Pixel ID from tenant config. |
| `src/components/shared/StructuredData/index.tsx:14` | `JSON.stringify(data)` for JSON-LD. | Safe **iff** callers never pass user-controlled fields. Spot check: see #3 below. |
| `src/components/shared/VideoSchema.tsx:28` | `JSON.stringify(schema)` for video JSON-LD. | All fields are derived server-side from a `videoId`; safe. |
| `src/components/atoms/ScrubbedPrice.tsx:29` | Price string with `<span>`-wrapped scrubbing. | Source is a generated HTML string built from a typed `number`; no user input flows in. |
| `src/components/atoms/ScrubbedDate.tsx:28` | Same scrubbing pattern for dates. | Same — typed value source, safe. |
| `src/components/atoms/ScrubbedText.tsx:53` | Same scrubbing pattern for text. | Source is internal scrubber; verify no PII or raw API string is ever passed directly. Low risk. |

### ⚠️ Needs follow-up

#### 1. `src/components/pages/listing/components/HomeDescription.tsx:38`

```tsx
const formattedDescription = formatMultiLineText(description || '')
// ...
<div dangerouslySetInnerHTML={{ __html: formattedDescription }} />
```

- **Source:** `description` prop, which is the listing description coming
  from the Repliers API.
- **Risk:** Repliers data is third-party, not developer-controlled. A
  malicious or buggy listing description containing `<script>` or
  `<img onerror=...>` would execute.
- **Mitigation options (in order of ladder preference):**
  1. **Rung 4 — native:** drop `dangerouslySetInnerHTML` entirely and render
     `description` as text, replacing `\n` with `<br />` via React's normal
     children. This is what most listing portals do.
  2. **Rung 5 — installed dep:** if `formatMultiLineText` produces HTML you
     actually need (links, paragraphs), pass it through `DOMPurify` before
     injection. (DOMPurify is small and is the standard sanitizer.)
  3. Confirm with Repliers what HTML, if any, is permitted in listing
     descriptions and whether they sanitize on their side. If they do, get
     it in writing.

#### 2. `src/app/[...slugs]/page.tsx:617`

```tsx
<Typography
  variant="body1"
  dangerouslySetInnerHTML={{ __html: mod.data.content ?? '' }}
/>
```

- **Source:** `mod.data.content` — module content from the page-generator /
  CMS-style admin panel. Authored by admin users (you/team), not anonymous
  users.
- **Risk:** Lower than #1 because authors are trusted, **but** any admin
  account takeover instantly becomes XSS on every public page. Stored XSS.
- **Mitigation:**
  1. **Preferred:** if `mod.data.content` is Markdown, render via the
     existing `react-markdown` dep (already in `package.json`). Rung 5.
  2. If it must remain raw HTML, sanitize through DOMPurify on read.
  3. As a defense-in-depth measure, tighten Content-Security-Policy on
     pages that render module content so inline `<script>` is blocked even
     if XSS slips in.

#### 3. `src/app/admin/ai-content/page.tsx:311`

```tsx
<div dangerouslySetInnerHTML={{ __html: generatedBlog.content }} />
```

- **Source:** AI-generated blog content fetched from an internal API
  endpoint that wraps an LLM.
- **Risk:** AI output is not "developer-controlled" — prompt injection or
  a malicious source document can cause the model to return active HTML.
  This sink lives on the admin preview page, but the same `generatedBlog
  .content` likely gets persisted (line 137 saves `content` to the blog
  store) and ultimately served to the public.
- **Mitigation:**
  1. Sanitize through DOMPurify both at preview-render time *and* at save
     time. Sanitizing only on save means a malicious string can still hit
     the admin's own browser.
  2. Strongly prefer storing AI output as Markdown rather than HTML and
     rendering via `react-markdown`. Removes the entire class of issue.

## Recommended order of follow-up work

1. **Listing description (#1)** — public-facing, third-party data, highest
   exposure. Fix first.
2. **Page module content (#2)** — public-facing, admin-authored. Fix
   second.
3. **AI blog (#3)** — admin preview *and* persisted output. Fix third,
   ideally by switching the storage format to Markdown.

All three fixes should land in a separate PR — they involve real behavior
changes (e.g. switching to Markdown rendering) that need testing on actual
content, not just a search-and-replace.
