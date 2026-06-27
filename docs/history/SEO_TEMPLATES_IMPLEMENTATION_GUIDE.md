# SEO Templates Implementation Guide

Complete guide for implementing SEO templates across all page types in Florida Home Finder.

---

## Table of Contents

1. [Overview](#overview)
2. [Template Files Location](#template-files-location)
3. [Implementation by Page Type](#implementation-by-page-type)
4. [Common Patterns](#common-patterns)
5. [Metadata Generation](#metadata-generation)
6. [Structured Data Usage](#structured-data-usage)
7. [Canonical URLs](#canonical-urls)
8. [Image Optimization](#image-optimization)
9. [Testing & Validation](#testing--validation)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

The SEO templates provide reusable patterns for implementing SEO across all page types:

| Page Type | Template File | Priority | Traffic |
|-----------|---------------|----------|---------|
| Property Listings | `listing/_seo-template.tsx` | ⭐⭐⭐⭐⭐ | Very High |
| Location Pages | `listings/_location-seo-template.tsx` | ⭐⭐⭐⭐⭐ | Very High |
| Blog Posts | `blog/_seo-template.tsx` | ⭐⭐⭐⭐ | High |
| Estimate Pages | `estimate/_seo-template.tsx` | ⭐⭐⭐⭐ | High |
| Search Results | `search/_seo-template.tsx` | ⭐⭐⭐ | Medium |
| Static Pages | `_(StaticPages)/_seo-template.tsx` | ⭐⭐ | Low |

---

## Template Files Location

All template files are located at:

```
/src/app/
├── listing/_seo-template.tsx              # Property detail pages
├── listings/_location-seo-template.tsx    # Location-based landing pages
├── blog/_seo-template.tsx                 # Blog post pages
├── search/_seo-template.tsx               # Search results
├── (Estimates)/estimate/_seo-template.tsx # Valuation pages
└── (StaticPages)/_seo-template.tsx        # Privacy, terms, etc.
```

---

## Implementation by Page Type

### 1. Property Listing Pages (HIGHEST PRIORITY)

**File:** `src/app/listing/[[...listingName]]/page.tsx`

**What the template provides:**
- Dynamic metadata generation based on property data
- `propertySchema()` for rich snippets showing price, bedrooms, bathrooms
- Breadcrumb navigation schema
- Open Graph optimization for social sharing
- Canonical URL setup

**Implementation steps:**

```typescript
// 1. Import required utilities
import { generateMetadata } from './page.tsx'
import { propertySchema, breadcrumbSchema } from '@/utils/structuredData'
import StructuredData from '@shared/StructuredData'

// 2. Implement generateMetadata function
// Replace the TODO with actual API call to fetch property data
const property = await fetchPropertyBySlug(slug)

// 3. Add structured data to component
export default function ListingPage(props) {
  const propertyData = propertySchema({...property})
  const breadcrumbs = breadcrumbSchema([...])

  return (
    <>
      <StructuredData data={propertyData} />
      <StructuredData data={breadcrumbs} />
      {/* Your content */}
    </>
  )
}
```

**Key Optimizations:**
- Title format: `{address} - {price} | Florida Home Finder`
- Description: `{beds}BR/{baths}BA - {title}. {description} in {city}, FL.`
- Keywords: Location-specific, bed/bath counts, property type
- Rich snippets: Shows price, address, bedrooms in search results
- Open Graph: Property image (1200x630px minimum)

**Expected Results:**
- Property listings appear with rich snippets in SERPs
- Home buyers find properties more easily
- Better CTR from search results

---

### 2. Location Landing Pages (HIGHEST PRIORITY)

**File:** `src/app/listings/[[...slugs]]/page.tsx`

**What the template provides:**
- City/neighborhood specific metadata
- `localBusinessSchema()` for local SEO
- Location-based FAQ schema
- Breadcrumb schema
- Dynamic title/description with price stats

**Implementation steps:**

```typescript
// 1. Fetch location data (Miami, Orlando, Tampa, etc.)
const location = await fetchLocationData('miami')

// 2. Generate metadata with location keywords
// Title: "Homes for Sale in {city}, FL | Florida Home Finder"
// Description: "{count} homes | Average ${price}"

// 3. Add structured data
const localBusiness = localBusinessSchema({
  city: location.city,
  state: location.state,
  properties: location.activeListings,
  agents: location.agentCount
})

const faqs = faqSchema([
  { question: 'What is average price in {city}?', answer: '...' },
  { question: 'How many homes for sale?', answer: '...' },
  // etc.
])
```

**Pre-rendering static pages:**
```typescript
export async function generateStaticParams() {
  const majorCities = [
    'miami', 'orlando', 'tampa', 'jacksonville',
    'fort-lauderdale', 'west-palm-beach', 'naples'
  ]

  return majorCities.map(city => ({
    slugs: [city]
  }))
}
```

**Key Optimizations:**
- **"Homes for sale in [city]"** keyword targeting
- Local business schema shows address, service area
- FAQ schema answers common questions
- Pre-rendered pages for better performance
- Nested location pages: `/listings/florida/miami/brickell`

**Expected Results:**
- Rank for "homes for sale in {city}" keywords
- Show in local pack for "{city} homes"
- Increase local search visibility

---

### 3. Blog Posts (HIGH PRIORITY)

**File:** `src/app/blog/[slug]/page.tsx`

**What the template provides:**
- Article schema for rich snippets
- Author, publish date, update date tracking
- Open Graph with featured image
- Breadcrumb schema
- Dynamic keywords and descriptions

**Implementation steps:**

```typescript
// 1. Fetch blog post data
const post = await fetchBlogBySlug(slug)

// 2. Generate metadata from post data
export const generateMetadata = async ({ params }) => {
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.description,
    keywords: post.meta_keywords,
    openGraph: {
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: [{ url: post.featured_image_url }]
    }
  }
}

// 3. Add article schema
const articleData = articleSchema({
  title: post.title,
  description: post.description,
  content: post.content,
  author: post.author_name,
  publishedDate: post.published_at,
  image: post.featured_image_url
})
```

**Pre-rendering:**
```typescript
export async function generateStaticParams() {
  const posts = await fetchRecentBlogPosts(50)
  return posts.map(p => ({ slug: p.slug }))
}
```

**Key Optimizations:**
- Article schema shows in Google News
- Publish/update dates improve freshness signals
- Author info establishes expertise (E-E-A-T)
- Featured images increase CTR
- Related articles at bottom drive internal linking

**Expected Results:**
- Blog posts rank for long-tail keywords
- Show in Google News for recent posts
- Improve topical authority over time

---

### 4. Location-Based Landing Pages (HIGH PRIORITY)

**File:** Create dynamic pages for major Florida cities

**Pre-render these cities:**
```
/listings/miami
/listings/orlando
/listings/tampa
/listings/jacksonville
/listings/fort-lauderdale
/listings/west-palm-beach
/listings/naples
/listings/daytona-beach
/listings/clearwater
/listings/key-west
(and nested: /listings/florida/miami, /listings/florida/miami/brickell, etc.)
```

**Key Content Elements:**
- Market statistics (average price, median price, active listings)
- Neighborhood cards linking to neighborhood-specific pages
- Featured listings
- Location-specific FAQs
- Agent information for the area

**Schema Usage:**
- `localBusinessSchema()` for local SEO signals
- `faqSchema()` for common local questions
- `breadcrumbSchema()` for navigation

---

### 5. Estimate/Valuation Pages (HIGH PRIORITY)

**File:** `src/app/(Estimates)/estimate/[[...slugs]]/page.tsx`

**What the template provides:**
- Landing page metadata
- CTA-focused description
- FAQ schema for common questions
- Breadcrumb schema for multi-step form
- No structured data for form steps (keep dynamic)

**Implementation steps:**

```typescript
// For landing page (/estimate)
export const metadata = {
  title: 'Free Home Valuation Tool | Florida Home Finder',
  description: 'Get a free instant home valuation. AI-powered estimates based on recent comparables.',
  keywords: [
    'home valuation', 'home value estimate', 'property valuation',
    'home appraisal tool', 'free home value'
  ]
}

// Add FAQ schema with common valuation questions
const faqSchema = faqSchema([
  { question: 'How does the tool work?', answer: '...' },
  { question: 'Is it accurate?', answer: '...' },
  { question: 'Is it free?', answer: '...' }
])
```

**Key Optimizations:**
- **"Home valuation"** and **"home value estimate"** keywords
- Lead generation focus (clear CTAs)
- FAQ addresses user concerns (accuracy, cost, privacy)
- Simple, clear form flow
- Trust signals (AI-powered, instant, free)

**Expected Results:**
- Rank for home valuation keywords
- Drive qualified leads to estimate tool
- Generate agent connections

---

### 6. Search Results Pages (MEDIUM PRIORITY)

**File:** `src/app/search/[layout]/page.tsx`

**Important SEO Considerations:**

⚠️ **Mark most searches as `noindex`:**
```typescript
robots: {
  index: false,  // Don't index filtered results
  follow: true   // But follow the links
}
```

**Why?** Search result pages are:
- Duplicate content (same listings on multiple pages)
- Low-quality content (just filters + results)
- Not target keywords (location pages are better)

**What TO index:**
- Main location pages (`/listings/miami`)
- Popular searches (if you track them)
- Broad searches without many filters

**Implementation:**
```typescript
export const generateMetadata = ({ searchParams }) => {
  const hasFilters = searchParams?.minPrice || searchParams?.maxPrice
  const hasLocation = searchParams?.location

  return {
    robots: {
      index: hasLocation && !hasFilters,  // Index only location pages
      follow: true
    }
  }
}
```

**What to optimize:**
- User experience (fast, responsive design)
- Map functionality
- Filter options
- List/grid views
- Mobile experience

---

### 7. Static Pages (LOW PRIORITY)

**Files:**
- `src/app/(StaticPages)/privacy-policy/page.tsx`
- `src/app/(StaticPages)/terms-of-use/page.tsx`
- `src/app/(StaticPages)/cookies-policy/page.tsx`
- `src/app/(StaticPages)/accessibility/page.tsx`
- `src/app/(StaticPages)/dmca-notice/page.tsx`

**Implementation:**

```typescript
// Simple metadata (these pages aren't for SEO traffic)
export const metadata: Metadata = {
  title: 'Page Name | Florida Home Finder',
  description: 'Brief description of page content',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://floridahomefinder.com/page-path'
  }
}

// Optional: Add FAQ schema if page has FAQs
export default function Page() {
  const breadcrumbs = breadcrumbSchema([...])
  const faqs = faqSchema([...])  // If applicable

  return (
    <>
      <StructuredData data={breadcrumbs} />
      {faqs && <StructuredData data={faqs} />}
      {/* Content */}
    </>
  )
}
```

**Key Focus:**
- Legal compliance (complete information)
- Accessibility (semantic HTML, headings)
- Internal linking (to main pages)
- User trust (clear, well-organized content)

---

## Common Patterns

### Pattern 1: Dynamic Metadata with Data Fetching

```typescript
export async function generateMetadata(props): Promise<Metadata> {
  // Fetch data from API
  const data = await fetchDataFromAPI(params)

  if (!data) {
    return {
      robots: { index: false }  // No data = noindex
    }
  }

  // Generate metadata based on data
  return {
    title: `${data.title} | Florida Home Finder`,
    description: `${data.description}. Learn more about this property.`,
    alternates: {
      canonical: `https://floridahomefinder.com/${data.slug}`
    }
  }
}
```

### Pattern 2: Structured Data Injection

```typescript
export default function Page(props) {
  // Generate structured data
  const schema1 = propertySchema({...data})
  const schema2 = breadcrumbSchema([...items])

  return (
    <>
      <StructuredData data={schema1} />
      <StructuredData data={schema2} />
      {/* Page content */}
    </>
  )
}
```

### Pattern 3: Pre-rendering Popular Pages

```typescript
export async function generateStaticParams() {
  // Fetch popular pages/items
  const items = await fetchPopularItems(50)

  // Return params for pre-rendering
  return items.map(item => ({
    slug: item.slug
    // or params: item.id
  }))
}
```

### Pattern 4: Canonical URL Management

```typescript
// For paginated content
alternates: {
  canonical: `${baseUrl}/page?page=1`  // Always page 1
}

// For filtered content
alternates: {
  canonical: `${baseUrl}/listings/miami`  // Main location page
}

// For single items
alternates: {
  canonical: `${baseUrl}/listing/${slug}`
}
```

---

## Metadata Generation

### Title Best Practices

**Format by page type:**

| Type | Format | Example |
|------|--------|---------|
| Property | `{address} - ${price} \| Florida Home Finder` | `123 Main St - $450,000 \| Florida Home Finder` |
| Location | `Homes for Sale in {city}, {state} \| Florida Home Finder` | `Homes for Sale in Miami, FL \| Florida Home Finder` |
| Blog | `{title} \| Florida Home Finder` | `Best Miami Neighborhoods 2024 \| Florida Home Finder` |
| Estimate | `Free Home Valuation Tool \| Florida Home Finder` | `Free Home Valuation Tool \| Florida Home Finder` |
| Static | `{page name} \| Florida Home Finder` | `Privacy Policy \| Florida Home Finder` |

**Guidelines:**
- 50-60 characters ideal
- Include main keyword
- Include brand name
- Unique for each page
- Natural, readable language

### Description Best Practices

**Format by page type:**

| Type | Format | Length |
|------|--------|--------|
| Property | `{beds}BR/{baths}BA - {title}. {short_description}` | 150-160 chars |
| Location | `Browse {count} homes in {city}. Average price: ${price}. Find your dream home.` | 150-160 chars |
| Blog | `{excerpt}. Read our latest insights and tips.` | 150-160 chars |
| Estimate | `Get free instant valuation of your {city} home. AI-powered, 5 minutes.` | 150-160 chars |
| Static | `{brief explanation of page content}` | 150-160 chars |

**Guidelines:**
- 150-160 characters ideal
- Include 1-2 keywords naturally
- Include benefit/value proposition
- End with CTA when appropriate
- Avoid keyword stuffing

### Keyword Strategy

**Primary keywords (target top-level pages):**
- "homes for sale in {city}"
- "real estate {city}"
- "{city} homes"
- "{city} real estate agent"

**Secondary keywords (target specific listings/content):**
- "{address}"
- "{beds}br {baths}ba homes {city}"
- "luxury homes {city}"
- "waterfront property {city}"

**Long-tail keywords (blog, guides):**
- "best neighborhoods in {city}"
- "how to buy a home in {city}"
- "home valuation guide"
- "{city} real estate market trends"

---

## Structured Data Usage

### propertySchema - When to Use

✅ **Use for:**
- Individual property detail pages
- Property cards in listings
- MLS-based property displays

```typescript
const schema = propertySchema({
  id: property.id,
  title: property.address,
  description: property.description,
  price: property.price,
  address: property.address,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  squareFeet: property.squareFeet,
  image: property.featured_image_url,
  agentName: property.agent_name,
  agentEmail: property.agent_email
})
```

### articleSchema - When to Use

✅ **Use for:**
- Blog posts
- Educational content
- Market reports
- Real estate guides

```typescript
const schema = articleSchema({
  title: post.title,
  description: post.description,
  content: post.content,
  image: post.featured_image_url,
  author: post.author_name,
  publishedDate: post.published_at,
  modifiedDate: post.updated_at,
  url: `https://floridahomefinder.com/blog/${post.slug}`
})
```

### localBusinessSchema - When to Use

✅ **Use for:**
- Location-based landing pages
- Market area pages
- Service area descriptions

```typescript
const schema = localBusinessSchema({
  city: 'Miami',
  state: 'FL',
  zipCode: '33101',
  properties: 2543,
  agents: 156
})
```

### breadcrumbSchema - When to Use

✅ **Use for:**
- ALL pages with navigation hierarchy
- Help users understand page structure
- Improve SERP presentation

```typescript
const schema = breadcrumbSchema([
  { name: 'Home', url: 'https://floridahomefinder.com' },
  { name: 'Listings', url: 'https://floridahomefinder.com/listings' },
  { name: 'Miami', url: 'https://floridahomefinder.com/listings/miami' },
  { name: 'Property', url: 'https://floridahomefinder.com/listing/123' }
])
```

### faqSchema - When to Use

✅ **Use for:**
- Pages with FAQ sections
- Help answer common questions
- Reduce search result bounce rates

```typescript
const schema = faqSchema([
  { question: 'How much is rent?', answer: '...' },
  { question: 'What areas do you serve?', answer: '...' }
])
```

---

## Canonical URLs

**Rule 1: Every page gets a canonical**
```typescript
alternates: {
  canonical: 'https://floridahomefinder.com/page-path'
}
```

**Rule 2: Canonical should be the primary version**
- For properties: individual listing page
- For locations: `/listings/miami` (not search results)
- For blog: canonical slug URL
- For duplicates: point to original

**Rule 3: Absolute URLs (not relative)**
```typescript
// ✅ Correct
canonical: 'https://floridahomefinder.com/listings/miami'

// ❌ Wrong
canonical: '/listings/miami'
```

**Rule 4: Match metadataBase**
```typescript
// In content.ts
metadataBase: new URL('https://floridahomefinder.com')

// In pages
alternates: {
  canonical: 'https://floridahomefinder.com/page-path'
}
```

**Rule 5: Pagination canonical strategy**
```typescript
// Page 1: Canonical to page 1
// /listings?page=1
alternates: {
  canonical: 'https://floridahomefinder.com/listings?page=1'
}

// Page 2+: Canonical to page 1
// /listings?page=2
alternates: {
  canonical: 'https://floridahomefinder.com/listings?page=1'
}
```

---

## Image Optimization

### Image Format & Sizes

**When to use each format:**
- **WebP:** Modern browsers (automatic via Cloudinary)
- **AVIF:** Future-proof (via Cloudinary f=auto)
- **JPEG:** Fallback for old browsers
- **PNG:** Only if transparency needed

**Responsive image sizes:**
```typescript
<Image
  src={cloudinaryUrl}
  alt="Property image"
  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
  // Mobile: 100% width
  // Tablet: 50% width
  // Desktop: 33% width
/>
```

**Cloudinary optimization:**
```
// Original: https://res.cloudinary.com/.../image.jpg

// Optimized for web:
https://res.cloudinary.com/.../image.jpg?w=800&q=auto&f=auto

// Optimized for thumbnail:
https://res.cloudinary.com/.../image.jpg?w=300&q=auto&f=auto&c=thumb

// Optimized for hero:
https://res.cloudinary.com/.../image.jpg?w=1600&q=auto&f=auto&ar=16:9&c=fill
```

### Open Graph Images

**Dimensions:**
- Minimum: 1200x630px
- Ideal: 1200x630px (no larger than 5MB)

**Content:**
- Property: Featured property photo
- Blog: Featured article image
- Location: Neighborhood/city landmark
- Generic: Logo + title on colored background

---

## Testing & Validation

### 1. Test Metadata

```bash
# View page source and search for meta tags
curl https://localhost:3000/listing/123 | grep "<meta"

# Or use browser DevTools:
# 1. Right-click page
# 2. View Page Source (Ctrl+U / Cmd+U)
# 3. Search for <meta tags
```

### 2. Test Structured Data

**Google Rich Results Test:**
https://search.google.com/test/rich-results

**Steps:**
1. Paste page URL or HTML
2. Run test
3. Check for errors/warnings
4. Preview rich snippets

**What to check:**
- ✅ No errors
- ✅ Schema type displays correctly
- ✅ All required fields present
- ✅ Rich snippet preview looks good

### 3. Test Open Graph

**Facebook Sharing Debugger:**
https://developers.facebook.com/tools/debug/sharing/

**Steps:**
1. Paste URL
2. View shared preview
3. Check: Title, description, image
4. Validate image loads correctly

**What to check:**
- ✅ Correct title displays
- ✅ Description shows properly
- ✅ Image loads and displays
- ✅ No warnings about image size

### 4. Lighthouse Audit

```bash
# Via Chrome DevTools
1. Open page in Chrome
2. Ctrl+Shift+I (DevTools)
3. Run Lighthouse audit
4. Check SEO score

# Or via CLI
npm install -g @lhci/cli
lhci autorun
```

**What to check:**
- ✅ Meta description present
- ✅ Links have descriptive text
- ✅ Headings present and structured
- ✅ Mobile friendly
- ✅ Page speed (LCP, FID, CLS)

### 5. Mobile-Friendly Test

https://search.google.com/test/mobile-friendly

- ✅ Page responsive on mobile
- ✅ Text readable without zooming
- ✅ Tap targets properly sized
- ✅ No blocking resources

### 6. XML Sitemap

**Check sitemap:**
https://floridahomefinder.com/sitemap.xml

**What to check:**
- ✅ All important pages included
- ✅ Proper URL format
- ✅ Valid XML syntax
- ✅ Submit to Google Search Console

---

## Implementation Checklist

### Phase 1: Core Pages (Week 1-2)

- [ ] Implement Property listing page SEO
  - [ ] Dynamic metadata (title, description, keywords)
  - [ ] propertySchema() structured data
  - [ ] Breadcrumb schema
  - [ ] Open Graph tags
  - [ ] Test with Rich Results

- [ ] Implement Location landing pages
  - [ ] Pre-render 10 major cities
  - [ ] Dynamic metadata for each city
  - [ ] localBusinessSchema() for local SEO
  - [ ] Location-specific FAQs
  - [ ] Test each city page

- [ ] Update homepage
  - [ ] Review current metadata
  - [ ] Add organizationSchema()
  - [ ] Enhance Open Graph
  - [ ] Test homepage SEO

### Phase 2: Content Pages (Week 3)

- [ ] Implement Blog post SEO
  - [ ] Dynamic metadata for each post
  - [ ] articleSchema() structured data
  - [ ] Featured image optimization
  - [ ] Pre-render 50 recent posts
  - [ ] Test blog post pages

- [ ] Implement Static page SEO
  - [ ] Privacy policy metadata
  - [ ] Terms of use metadata
  - [ ] Other policy pages
  - [ ] Add FAQ schema where relevant

### Phase 3: Tool Pages (Week 4)

- [ ] Implement Estimate page SEO
  - [ ] Landing page metadata
  - [ ] FAQ schema for questions
  - [ ] Breadcrumb for form steps
  - [ ] Lead magnet optimization

- [ ] Implement Search result SEO
  - [ ] Mark filtered results as noindex
  - [ ] Optimize main searches
  - [ ] Breadcrumb navigation
  - [ ] Mobile optimization

### Phase 4: Testing & Refinement (Week 5)

- [ ] Validate all pages
  - [ ] Google Rich Results test (all pages)
  - [ ] Lighthouse audit (sample pages)
  - [ ] Mobile-friendly test (all page types)
  - [ ] Open Graph preview (social pages)

- [ ] Submit to Google
  - [ ] Sitemap to Search Console
  - [ ] Request indexing for key pages
  - [ ] Monitor crawl errors
  - [ ] Track search performance

- [ ] Monitor & Optimize
  - [ ] Track keyword rankings
  - [ ] Monitor impressions & CTR
  - [ ] Check for crawl errors
  - [ ] Update templates for improvements

---

## Quick Reference

### Minimum Metadata for Any Page

```typescript
export const metadata: Metadata = {
  title: 'Page Title | Florida Home Finder',
  description: 'Brief page description (150-160 chars)',
  alternates: {
    canonical: 'https://floridahomefinder.com/page-path'
  }
}
```

### Minimum Structured Data for Any Page

```typescript
// At minimum, add breadcrumb schema
const breadcrumbs = breadcrumbSchema([
  { name: 'Home', url: 'https://floridahomefinder.com' },
  { name: 'Current Page', url: 'https://floridahomefinder.com/page' }
])

return (
  <>
    <StructuredData data={breadcrumbs} />
    {/* Content */}
  </>
)
```

### Test All Pages

```bash
# Quick validation checklist for any page
1. Title: 50-60 chars, includes keyword + brand
2. Description: 150-160 chars, includes benefit
3. Open Graph: image (1200x630px), title, description
4. Structured Data: No errors in Rich Results test
5. Mobile: Responsive, readable, proper touch targets
6. Lighthouse: SEO score 90+
```

---

## Next Steps

1. **Choose starting page type** (Properties recommended - highest impact)
2. **Apply template** to your page files
3. **Replace TODOs** with actual API calls
4. **Test with Rich Results** tool
5. **Deploy & monitor** search performance
6. **Iterate** based on results

**Questions?** Check the main `SEO_OPTIMIZATION_GUIDE.md` for broader concepts and strategies.

