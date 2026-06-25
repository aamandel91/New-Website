/**
 * TENANT CONFIG SELECTOR — change once, update everywhere.
 *
 * This file defines the TenantConfig shape and selects the active brand at
 * startup based on NEXT_PUBLIC_TENANT. Every per-brand value lives in
 * src/configs/tenants/<brand>.ts. Footer, header, About page, structured data,
 * AI prompt context, OG images, email templates, MUI theme, logo references,
 * hero imagery, and integrations all read the selected `tenant` from here.
 *
 * Accepted NEXT_PUBLIC_TENANT values:
 *   floridahomefinder  (default — used when unset or unrecognized)
 *   countryclub
 *
 * Email addresses are intentionally split:
 *   contact.email       — marketing / general / public-facing inbox
 *   contact.legalEmail  — DMCA notices, account termination requests,
 *                         copyright claims, and other legal correspondence
 *
 * To customize a brand:
 * 1. Edit src/configs/tenants/<brand>.ts (including `visualIdentity` for
 *    colors, logo, fonts) — each brand is a plain, standalone file.
 * 2. Replace logo asset(s) referenced by `visualIdentity.logo.src` in /public
 * 3. Replace hero image asset(s) referenced by `visualIdentity.heroImages` in /public
 * 4. If a backend value changed, also update backend/src/config/tenant.config.ts
 *    (until a shared workspace is set up, the backend mirrors brand fields)
 * 5. Restart the dev server
 *
 * To switch brands: set NEXT_PUBLIC_TENANT (see env.example) and rebuild.
 *
 * Values NOT in this config (intentional):
 * - Market geography (counties, cities) — see src/configs/defaults/page-generation.ts
 * - SEO meta titles/descriptions — see src/configs/defaults/site-settings.ts and
 *   the live page generators (e.g. src/app/[...slugs]/page.tsx). Per-page-type
 *   SEO coverage is documented in docs/seo/seo-coverage.md.
 *
 * Visual identity: most touchpoints (MUI palette, OG generators, logo, hero
 * image, footer/header brand colors) read from `visualIdentity` below.
 * Residual hardcoded references that still require manual editing are
 * catalogued in docs/template/visual-identity-residuals.md.
 */

import { tenant as floridahomefinder } from './tenants/floridahomefinder'
import { tenant as countryclub } from './tenants/countryclub'

export interface TenantVisualIdentity {
  // Color tokens
  colors: {
    primary: string // main brand color (CTAs, links, header accents)
    primaryDark: string // hover/pressed state
    primaryLight: string // tints, secondary surfaces
    accent: string // highlight color (OG image accent, dividers)
    accentDark: string
    accentLight: string
    text: string // primary text color
    textMuted: string
    background: string
    surface: string
    border: string
    success: string
    warning: string
    error: string
    info: string
    // Header/footer chrome (dark navy band on every page)
    headerBackground: string
    footerBackground: string
    // Marketing/OG image specific
    ogBackground: string // dark navy used in OG image background
    ogMuted: string // muted text on OG images
  }
  // Logo assets
  logo: {
    src: string // path to header logo (SVG/PNG in /public)
    footerSrc: string // path to footer logo (often a different aspect)
    alt: string // alt text (typically the brand name)
    width: number // intrinsic width of header logo
    height: number // intrinsic height of header logo
    footerWidth: number
    footerHeight: number
  }
  // Fonts
  fonts: {
    heading: string // CSS font-family stack for headings
    body: string // CSS font-family stack for body
    googleFontsUrl?: string // optional Google Fonts CDN URL (if not using next/font)
  }
  // Hero / marketing imagery
  heroImages: {
    homepage: string // homepage hero image URL or path (empty = use gradient fallback)
    homepageGradient: string // CSS gradient used when homepage hero image is unset
    citySearch?: string // city landing page hero
    propertyDetail?: string // PDP fallback hero
  }
  // OG image text styling
  ogImage: {
    fontFamily: string // sans-serif/serif fallback for OG ImageResponse
  }
}

export interface TenantConfig {
  // Brand identity
  brand: {
    siteName: string // "Florida Home Finder"
    teamName: string // "The Mandel Team"
    leaderName: string // "Andy Mandel"
    leaderYearsExperience: number
    slogan: string // "The agent you work with matters."
    brokerage: string // display brokerage (footer, about, contact), e.g. "eXp Realty"
    brokerageLuxury: string // luxury sub-brand used in AI prompt context, e.g. "eXp Luxury"
    domain: string // "floridahomefinder.com"
    domainDisplay: string // "FloridaHomeFinder.com" — branded casing for headings/footers
    siteUrl: string // "https://floridahomefinder.com"
  }
  // Contact
  contact: {
    phone: string // display format "(954) 610-0563"
    phoneE164: string // "+19546100563" — for tel: links and structured data
    phoneDigits: string // "9546100563" — for raw uses
    email: string // "info@floridahomefinder.com" — marketing/general inbox
    legalEmail: string // "andy@mandelteam.com" — DMCA / account / legal correspondence
    notificationsEmail: string // "notifications@mandelteam.com" — listing-alerts team sender
    inboundReplyDomain: string // "reply.floridahomefinder.com" — SendGrid Inbound Parse host
    fallbackAgentEmail: string // catches replies that can't be routed
    address: {
      street: string
      city: string
      state: string
      zip: string
      full: string // computed: full single-line address
    }
  }
  // Repliers infra (used by listing-alerts client provisioning)
  repliers: {
    agentId: number // default Repliers Agent ID; 0 = unset (graceful degrade)
    baseUrl: string
    csrUrl: string
  }
  // Integrations
  integrations: {
    lender: {
      name: string // "Cross Country Mortgage"
      applyUrl: string // pre-approval landing URL
    }
    instantOffer: {
      provider: string // "HiFello"
      url: string // landing URL
    }
    crm: {
      provider: 'suresend' | 'fub' | string
      pixelId: string
    }
  }
  // Visual identity (colors, logo, fonts, hero imagery)
  visualIdentity: TenantVisualIdentity
}

const TENANTS = {
  floridahomefinder,
  countryclub
} satisfies Record<string, TenantConfig>

const DEFAULT_TENANT: keyof typeof TENANTS = 'floridahomefinder'

// NEXT_PUBLIC_ vars are inlined at build time by Next.js, so this must use dot
// notation (process.env.NEXT_PUBLIC_TENANT) to be statically replaced in both
// server and client bundles.
const requested = process.env.NEXT_PUBLIC_TENANT

// Unknown/unset values fall back to the default brand.
export const tenant: TenantConfig =
  requested && requested in TENANTS
    ? TENANTS[requested as keyof typeof TENANTS]
    : TENANTS[DEFAULT_TENANT]
